import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './User';

@Entity('villages')
export class Village {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  area: string | null;

  @OneToMany(() => User, (user) => user.village)
  chiefs: User[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
