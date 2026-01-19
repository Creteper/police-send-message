import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;
}
