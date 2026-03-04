import { config } from '../config';

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
}

interface Code2SessionResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

interface SubscribeMessageData {
  [key: string]: {
    value: string;
  };
}

export class WechatService {
  private static accessToken: string | null = null;
  private static tokenExpireTime: number = 0;

  /**
   * 调试：打印微信配置信息
   */
  private static logConfig(): void {
    const { appId, appSecret, templateId } = config.wechat;
    console.log('[WechatService] 微信配置信息:');
    console.log(`  - appId: ${appId ? appId.substring(0, 6) + '***' : '未配置'}`);
    console.log(`  - appSecret: ${appSecret ? appSecret.substring(0, 6) + '***' : '未配置'}`);
    console.log(`  - templateId: ${templateId ? templateId.substring(0, 10) + '***' : '未配置'}`);
  }

  /**
   * 获取微信 access_token（自动缓存）
   */
  static async getAccessToken(): Promise<string> {
    const now = Date.now();

    // 如果 token 未过期，直接返回缓存的 token
    if (this.accessToken && now < this.tokenExpireTime) {
      console.log('[WechatService] 使用缓存的 access_token');
      return this.accessToken;
    }

    this.logConfig();
    const { appId, appSecret } = config.wechat;
    
    if (!appId || !appSecret) {
      throw new Error('微信配置缺失: appId 或 appSecret 未配置，请检查 .env 文件');
    }
    
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    console.log('[WechatService] 请求 access_token...');

    const response = await fetch(url);
    const data = (await response.json()) as AccessTokenResponse;
    console.log('[WechatService] access_token 响应:', JSON.stringify(data, null, 2));

    if (data.errcode) {
      throw new Error(`获取 access_token 失败: ${data.errmsg}`);
    }

    this.accessToken = data.access_token;
    // 提前 5 分钟过期，避免临界情况
    this.tokenExpireTime = now + (data.expires_in - 300) * 1000;

    return this.accessToken;
  }

  /**
   * 使用 code 换取用户的 openid 和 session_key
   */
  static async code2Session(code: string): Promise<Code2SessionResponse> {
    this.logConfig();
    const { appId, appSecret } = config.wechat;
    
    if (!appId || !appSecret) {
      throw new Error('微信配置缺失: appId 或 appSecret 未配置，请检查 .env 文件');
    }
    
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
    console.log(`[WechatService] code2Session 请求, code: ${code}`);

    const response = await fetch(url);
    const data = (await response.json()) as Code2SessionResponse;
    console.log('[WechatService] code2Session 响应:', JSON.stringify(data, null, 2));

    if (data.errcode) {
      throw new Error(`code2session 失败: ${data.errmsg}`);
    }

    console.log(`[WechatService] 成功获取 openid: ${data.openid}`);
    return data;
  }

  /**
   * 发送订阅消息
   */
  static async sendSubscribeMessage(
    openid: string,
    data: SubscribeMessageData,
    page?: string
  ): Promise<boolean> {
    try {
      console.log('[WechatService] 准备发送订阅消息...');
      console.log(`  - openid: ${openid}`);
      console.log(`  - data: ${JSON.stringify(data)}`);
      console.log(`  - page: ${page || '(未设置)'}`);
      
      const accessToken = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;

      const payload = {
        touser: openid,
        template_id: config.wechat.templateId,
        page: page || '',
        data,
      };
      
      console.log('[WechatService] 订阅消息请求体:', JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { errcode: number; errmsg?: string };
      console.log('[WechatService] 订阅消息响应:', JSON.stringify(result, null, 2));

      if (result.errcode !== 0) {
        console.error('[WechatService] 发送订阅消息失败:', result);
        return false;
      }

      console.log(`[WechatService] 订阅消息发送成功，openid: ${openid}`);
      return true;
    } catch (error) {
      console.error('[WechatService] 发送订阅消息异常:', error);
      return false;
    }
  }

  /**
   * 发送违章通知给村长
   * 模板：收到信件通知
   * - thing1: 寄信人
   * - time2: 寄信时间
   * - thing3: 温馨提示
   */
  static async sendViolationNotification(
    openid: string,
    violationInfo: {
      senderName: string;
      sendTime: Date;
      tips: string;
    },
    page?: string
  ): Promise<boolean> {
    console.log('[WechatService] 发送违章通知:');
    console.log(`  - openid: ${openid}`);
    console.log(`  - senderName: ${violationInfo.senderName}`);
    console.log(`  - sendTime: ${violationInfo.sendTime}`);
    console.log(`  - tips: ${violationInfo.tips}`);
    
    const data: SubscribeMessageData = {
      thing1: { value: violationInfo.senderName.slice(0, 20) },
      time2: { value: this.formatDate(violationInfo.sendTime) },
      thing3: { value: violationInfo.tips.slice(0, 20) },
    };

    return this.sendSubscribeMessage(openid, data, page);
  }

  /**
   * 格式化日期为微信要求的格式
   */
  private static formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}
