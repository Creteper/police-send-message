# 警察-村长违章消息系统 API 接口文档

## 基本信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **请求格式**: JSON
- **响应格式**: JSON

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

### 分页响应
```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

## 通用请求头

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Authorization | string | 是(除登录外) | Bearer {token} |
| Content-Type | string | 是 | application/json |

## 通用查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 当前页码 |
| pageSize | number | 10 | 每页数量 |

---

## 一、认证模块 `/api/auth`

### 1.1 用户登录

**接口地址**: `POST /api/auth/login`

**请求参数**:
```json
{
  "username": "police001",
  "password": "123456"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "police001",
      "name": "张警官",
      "phone": "13800138001",
      "role": "police",
      "badgeNumber": "P001",
      "avatar": null,
      "villageId": null,
      "village": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "登录成功"
}
```

**角色说明**:
- `police`: 警察
- `village_chief`: 村长

---

### 1.2 获取当前用户信息

**接口地址**: `GET /api/auth/profile`

**请求头**: 需要 Authorization

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "police001",
    "name": "张警官",
    "phone": "13800138001",
    "role": "police",
    "badgeNumber": "P001",
    "avatar": null,
    "villageId": null,
    "village": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 1.3 更新个人信息

**接口地址**: `PUT /api/auth/profile`

**请求头**: 需要 Authorization

**请求参数**:
```json
{
  "name": "张警官",
  "phone": "13800138002",
  "avatar": "/uploads/avatar/1.jpg"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 真实姓名 |
| phone | string | 否 | 手机号 |
| avatar | string | 否 | 头像URL |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "police001",
    "name": "张警官",
    "phone": "13800138002",
    "role": "police",
    "badgeNumber": "P001",
    "avatar": "/uploads/avatar/1.jpg"
  },
  "message": "更新成功"
}
```

---

### 1.4 修改密码

**接口地址**: `PUT /api/auth/password`

**请求头**: 需要 Authorization

**请求参数**:
```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码 |

**响应示例**:
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

---

### 1.5 用户登出

**接口地址**: `POST /api/auth/logout`

**请求头**: 需要 Authorization

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

## 二、警察端接口 `/api/police`

> 所有警察端接口需要 Authorization 头，且用户角色必须为 `police`

### 2.1 获取未处理的违章列表

**接口地址**: `GET /api/police/violations/pending`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "violationTime": "2024-01-15T10:30:00.000Z",
        "violationTag": "超载",
        "imageUrl": "/uploads/mock/violation_1.jpg",
        "offenderName": "张伟",
        "offenderPhone": "13812345678",
        "plateNumber": "黑AA1234",
        "ownerName": "张伟",
        "ownerPhone": "13812345678",
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

**违章状态说明**:
- `pending`: 未处理
- `processing`: 处理中
- `completed`: 已完成
- `returned`: 被退回

---

### 2.2 获取被退回的违章列表

**接口地址**: `GET /api/police/violations/returned`

**查询参数**: 同2.1

**响应示例**: 同2.1，status为`returned`

---

### 2.3 获取违章详情

**接口地址**: `GET /api/police/violations/:id`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 违章ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "violationTime": "2024-01-15T10:30:00.000Z",
    "violationTag": "超载",
    "imageUrl": "/uploads/mock/violation_1.jpg",
    "offenderName": "张伟",
    "offenderPhone": "13812345678",
    "plateNumber": "黑AA1234",
    "ownerName": "张伟",
    "ownerPhone": "13812345678",
    "status": "pending",
    "messages": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2.4 分发违章给村长

**接口地址**: `POST /api/police/violations/:id/dispatch`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 违章ID |

**请求参数**:
```json
{
  "villageChiefIds": [2, 3, 4]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| villageChiefIds | number[] | 是 | 村长ID数组，支持多选 |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "violationId": 1,
      "policeId": 1,
      "villageChiefId": 2,
      "status": "unread",
      "sentAt": "2024-01-15T11:00:00.000Z",
      "readAt": null,
      "processedAt": null,
      "isLocalResident": null,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "message": "成功分发给3个村长"
}
```

---

### 2.5 获取未被村长查看的消息

**接口地址**: `GET /api/police/messages/unread`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "violationId": 1,
        "policeId": 1,
        "villageChiefId": 2,
        "status": "unread",
        "sentAt": "2024-01-15T11:00:00.000Z",
        "readAt": null,
        "processedAt": null,
        "isLocalResident": null,
        "violation": {
          "id": 1,
          "violationTag": "超载",
          "offenderName": "张伟",
          "plateNumber": "黑AA1234"
        },
        "villageChief": {
          "id": 2,
          "name": "龙镇村村长",
          "phone": "13800138002",
          "village": {
            "id": 1,
            "name": "龙镇村",
            "area": "五大连池市龙镇"
          }
        }
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

---

### 2.6 获取超时未查看的消息

**接口地址**: `GET /api/police/messages/timeout`

**查询参数**: 同2.5

**响应示例**: 同2.5，status为`timeout`

---

### 2.7 获取被退回的消息

**接口地址**: `GET /api/police/messages/rejected`

**查询参数**: 同2.5

**响应示例**: 同2.5，status为`rejected`

---

### 2.8 获取消息详情

**接口地址**: `GET /api/police/messages/:id`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 消息ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "violationId": 1,
    "policeId": 1,
    "villageChiefId": 2,
    "status": "unread",
    "sentAt": "2024-01-15T11:00:00.000Z",
    "readAt": null,
    "processedAt": null,
    "isLocalResident": null,
    "violation": {
      "id": 1,
      "violationTime": "2024-01-15T10:30:00.000Z",
      "violationTag": "超载",
      "imageUrl": "/uploads/mock/violation_1.jpg",
      "offenderName": "张伟",
      "offenderPhone": "13812345678",
      "plateNumber": "黑AA1234",
      "ownerName": "张伟",
      "ownerPhone": "13812345678",
      "status": "processing"
    },
    "police": {
      "id": 1,
      "name": "张警官",
      "phone": "13800138001",
      "badgeNumber": "P001"
    },
    "villageChief": {
      "id": 2,
      "name": "龙镇村村长",
      "phone": "13800138002",
      "village": {
        "id": 1,
        "name": "龙镇村",
        "area": "五大连池市龙镇"
      }
    }
  }
}
```

---

### 2.9 获取历史记录

**接口地址**: `GET /api/police/history`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | `completed`(已完成) 或 `uncompleted`(未完成)，默认`completed` |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应示例**: 同2.5

---

### 2.10 获取所有村庄列表

**接口地址**: `GET /api/police/villages`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "龙镇村",
      "area": "五大连池市龙镇",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "chiefs": [
        {
          "id": 2,
          "name": "龙镇村村长",
          "phone": "13800138002",
          "username": "chief001"
        }
      ]
    },
    {
      "id": 2,
      "name": "和平村",
      "area": "五大连池市和平镇",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "chiefs": [
        {
          "id": 3,
          "name": "和平村村长",
          "phone": "13800138003",
          "username": "chief002"
        }
      ]
    }
  ]
}
```

---

### 2.11 获取村长信息

**接口地址**: `GET /api/police/village-chief/:id`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 村长ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "chief001",
    "name": "龙镇村村长",
    "phone": "13800138002",
    "role": "village_chief",
    "avatar": null,
    "villageId": 1,
    "village": {
      "id": 1,
      "name": "龙镇村",
      "area": "五大连池市龙镇"
    }
  }
}
```

---

## 三、村长端接口 `/api/village`

> 所有村长端接口需要 Authorization 头，且用户角色必须为 `village_chief`

### 3.1 获取待处理消息列表

**接口地址**: `GET /api/village/messages/pending`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "violationId": 1,
        "policeId": 1,
        "villageChiefId": 2,
        "status": "unread",
        "sentAt": "2024-01-15T11:00:00.000Z",
        "readAt": null,
        "processedAt": null,
        "isLocalResident": null,
        "violation": {
          "id": 1,
          "violationTime": "2024-01-15T10:30:00.000Z",
          "violationTag": "超载",
          "imageUrl": "/uploads/mock/violation_1.jpg",
          "offenderName": "张伟",
          "offenderPhone": "13812345678",
          "plateNumber": "黑AA1234",
          "ownerName": "张伟",
          "ownerPhone": "13812345678"
        },
        "police": {
          "id": 1,
          "name": "张警官",
          "badgeNumber": "P001"
        }
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

**消息状态说明**:
- `unread`: 未读
- `read`: 已读
- `confirmed`: 已确认(是本村人)
- `rejected`: 已退回(非本村人)
- `timeout`: 已超时

---

### 3.2 获取消息详情

**接口地址**: `GET /api/village/messages/:id`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 消息ID |

**说明**: 查看消息详情会自动将 `unread` 状态更新为 `read`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "violationId": 1,
    "policeId": 1,
    "villageChiefId": 2,
    "status": "read",
    "sentAt": "2024-01-15T11:00:00.000Z",
    "readAt": "2024-01-15T12:00:00.000Z",
    "processedAt": null,
    "isLocalResident": null,
    "violation": {
      "id": 1,
      "violationTime": "2024-01-15T10:30:00.000Z",
      "violationTag": "超载",
      "imageUrl": "/uploads/mock/violation_1.jpg",
      "offenderName": "张伟",
      "offenderPhone": "13812345678",
      "plateNumber": "黑AA1234",
      "ownerName": "张伟",
      "ownerPhone": "13812345678",
      "status": "processing"
    },
    "police": {
      "id": 1,
      "name": "张警官",
      "phone": "13800138001",
      "badgeNumber": "P001",
      "avatar": null
    },
    "villageChief": {
      "id": 2,
      "name": "龙镇村村长",
      "phone": "13800138002",
      "village": {
        "id": 1,
        "name": "龙镇村",
        "area": "五大连池市龙镇"
      }
    }
  }
}
```

---

### 3.3 确认消息（是本村人）

**接口地址**: `POST /api/village/messages/:id/confirm`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 消息ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "violationId": 1,
    "policeId": 1,
    "villageChiefId": 2,
    "status": "confirmed",
    "sentAt": "2024-01-15T11:00:00.000Z",
    "readAt": "2024-01-15T12:00:00.000Z",
    "processedAt": "2024-01-15T12:30:00.000Z",
    "isLocalResident": true
  },
  "message": "已确认，该违规人为本村人"
}
```

---

### 3.4 退回消息（非本村人）

**接口地址**: `POST /api/village/messages/:id/reject`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 消息ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "violationId": 1,
    "policeId": 1,
    "villageChiefId": 2,
    "status": "rejected",
    "sentAt": "2024-01-15T11:00:00.000Z",
    "readAt": "2024-01-15T12:00:00.000Z",
    "processedAt": "2024-01-15T12:30:00.000Z",
    "isLocalResident": false
  },
  "message": "已退回，该违规人非本村人"
}
```

---

### 3.5 获取历史记录

**接口地址**: `GET /api/village/history`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | `processed`(已处理) 或 `unprocessed`(未处理)，默认`processed` |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应示例**: 同3.1

---

### 3.6 获取管辖警察信息

**接口地址**: `GET /api/village/police-info`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| policeId | number | 是 | 警察ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "police001",
    "name": "张警官",
    "phone": "13800138001",
    "role": "police",
    "badgeNumber": "P001",
    "avatar": null
  }
}
```

---

## 四、Mock数据接口 `/api/mock`

> 用于开发测试，生成模拟违章数据

### 4.1 批量生成违章数据

**接口地址**: `POST /api/mock/violations/generate`

**请求参数**:
```json
{
  "count": 10
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| count | number | 否 | 生成数量，1-100，默认10 |

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "violationTime": "2024-01-10T08:30:00.000Z",
      "violationTag": "超载",
      "imageUrl": "/uploads/mock/violation_1705912200000_0.jpg",
      "offenderName": "张伟",
      "offenderPhone": "13812345678",
      "plateNumber": "黑AB1234",
      "ownerName": "张伟",
      "ownerPhone": "13812345678",
      "status": "pending"
    }
  ],
  "message": "成功生成10条违章数据"
}
```

---

### 4.2 手动添加违章数据

**接口地址**: `POST /api/mock/violations`

**请求参数**:
```json
{
  "violationTime": "2024-01-15T10:30:00.000Z",
  "violationTag": "超载",
  "imageUrl": "/uploads/violation_1.jpg",
  "offenderName": "张伟",
  "offenderPhone": "13812345678",
  "plateNumber": "黑AA1234",
  "ownerName": "李明",
  "ownerPhone": "13887654321"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| violationTime | string | 否 | 违章时间，ISO格式，默认当前时间 |
| violationTag | string | 是 | 违规标签 |
| imageUrl | string | 否 | 违章图片URL |
| offenderName | string | 是 | 违规人姓名 |
| offenderPhone | string | 是 | 违规人手机号 |
| plateNumber | string | 是 | 车牌号 |
| ownerName | string | 是 | 车主姓名 |
| ownerPhone | string | 是 | 车主手机号 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "violationTime": "2024-01-15T10:30:00.000Z",
    "violationTag": "超载",
    "imageUrl": "/uploads/violation_1.jpg",
    "offenderName": "张伟",
    "offenderPhone": "13812345678",
    "plateNumber": "黑AA1234",
    "ownerName": "李明",
    "ownerPhone": "13887654321",
    "status": "pending"
  },
  "message": "违章数据创建成功"
}
```

---

## 五、系统接口

### 5.1 健康检查

**接口地址**: `GET /api/health`

**响应示例**:
```json
{
  "success": true,
  "message": "服务运行正常",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

## 六、错误码说明

| HTTP状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/认证失败 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 七、数据字典

### 用户角色 (UserRole)
| 值 | 说明 |
|----|------|
| police | 警察 |
| village_chief | 村长 |

### 违章状态 (ViolationStatus)
| 值 | 说明 |
|----|------|
| pending | 未处理 |
| processing | 处理中 |
| completed | 已完成 |
| returned | 被退回 |

### 消息状态 (MessageStatus)
| 值 | 说明 |
|----|------|
| unread | 未读(对方未查看) |
| read | 已读(对方已查看) |
| confirmed | 已确认(是本村人) |
| rejected | 已退回(非本村人) |
| timeout | 已超时 |

---

## 八、默认测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 警察 | police001 | 123456 | 默认警察账号 |
| 村长 | chief001 | 123456 | 龙镇村村长 |
| 村长 | chief002 | 123456 | 和平村村长 |
| 村长 | chief003 | 123456 | 建设村村长 |
| 村长 | chief004 | 123456 | 太平村村长 |
| 村长 | chief005 | 123456 | 新发村村长 |
| 村长 | chief006 | 123456 | 兴隆村村长 |
| 村长 | chief007 | 123456 | 团结村村长 |
| 村长 | chief008 | 123456 | 双泉村村长 |
| 村长 | chief009 | 123456 | 朝阳村村长 |
| 村长 | chief010 | 123456 | 莲花村村长 |

---

## 九、系统配置

在数据库 `system_configs` 表中可配置以下参数：

| key | 默认值 | 说明 |
|-----|--------|------|
| unread_timeout_hours | 24 | 消息未查看超时时间(小时) |

修改示例:
```sql
UPDATE system_configs SET value = '48' WHERE `key` = 'unread_timeout_hours';
```
