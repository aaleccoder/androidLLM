import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ApiKey {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { unique: true })
    serviceName!: string;

    @Column('text')
    encryptedKey!: string;
}