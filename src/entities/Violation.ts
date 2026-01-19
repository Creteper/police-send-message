import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ViolationStatus } from '../types';
import { Message } from './Message';

@Entity('violations')
export class Violation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'datetime', name: 'violation_time' })
  violationTime: Date;

  @Column({ type: 'varchar', length: 100, name: 'violation_tag' })
  violationTag: string;

  @Column({ type: 'varchar', length: 255, name: 'image_url', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 50, name: 'offender_name' })
  offenderName: string;

  @Column({ type: 'varchar', length: 20, name: 'offender_phone' })
  offenderPhone: string;

  @Column({ type: 'varchar', length: 20, name: 'plate_number' })
  plateNumber: string;

  @Column({ type: 'varchar', length: 50, name: 'owner_name' })
  ownerName: string;

  @Column({ type: 'varchar', length: 20, name: 'owner_phone' })
  ownerPhone: string;

  @Column({ type: 'enum', enum: ViolationStatus, default: ViolationStatus.PENDING })
  status: ViolationStatus;

  @OneToMany(() => Message, (message) => message.violation)
  messages: Message[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
