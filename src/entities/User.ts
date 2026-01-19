import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../types';
import { Village } from './Village';
import { Message } from './Message';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'badge_number' })
  badgeNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string | null;

  @Column({ type: 'int', nullable: true, name: 'village_id' })
  villageId: number | null;

  @ManyToOne(() => Village, (village) => village.chiefs)
  @JoinColumn({ name: 'village_id' })
  village: Village;

  @OneToMany(() => Message, (message) => message.police)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.villageChief)
  receivedMessages: Message[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
