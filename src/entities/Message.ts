import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MessageStatus } from '../types';
import { Violation } from './Violation';
import { User } from './User';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'violation_id' })
  violationId: number;

  @Column({ type: 'int', name: 'police_id' })
  policeId: number;

  @Column({ type: 'int', name: 'village_chief_id' })
  villageChiefId: number;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.UNREAD })
  status: MessageStatus;

  @Column({ type: 'datetime', name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'datetime', name: 'read_at', nullable: true })
  readAt: Date | null;

  @Column({ type: 'datetime', name: 'processed_at', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'boolean', name: 'is_local_resident', nullable: true })
  isLocalResident: boolean | null;

  @ManyToOne(() => Violation, (violation) => violation.messages)
  @JoinColumn({ name: 'violation_id' })
  violation: Violation;

  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: 'police_id' })
  police: User;

  @ManyToOne(() => User, (user) => user.receivedMessages)
  @JoinColumn({ name: 'village_chief_id' })
  villageChief: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
