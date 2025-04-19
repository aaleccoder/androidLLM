import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Settings {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('text', { nullable: true })
    customPrompt?: string;

    @Column('text', { nullable: true })
    openRouterModels?: string;
}