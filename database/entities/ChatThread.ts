import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { Message } from './Message';

@Entity()
export class ChatThread {
    @PrimaryColumn('text')
    id!: string;

    @Column('text')
    title!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column('text')
    modelId!: string;

    @Column('text')
    modelDisplayName!: string;

    @Column('text')
    modelProvider!: string;

    @Column('boolean', { default: false })
    isActive!: boolean;

    @OneToMany('Message', (message: Message) => message.chatThread, {
        cascade: true,
        eager: true
    })
    messages!: Message[];
}