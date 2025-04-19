import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import type { ChatThread } from './ChatThread';

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('boolean')
    isUser!: boolean;

    @Column('text')
    text!: string;

    @Index()
    @Column('integer')
    timestamp!: number;

    @Column('text')
    chatThreadId!: string;

    @ManyToOne('ChatThread', 'messages', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chatThreadId' })
    chatThread!: ChatThread;
}