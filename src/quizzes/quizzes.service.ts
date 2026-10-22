import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './quiz.entity';
import { Question } from './question.entity';
import { Submission } from './submission.entity';
import { QuizStatus, UserRole } from '../common/enums';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { FeedbackDto } from './dto/feedback.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz) private readonly quizzes: Repository<Quiz>,
    @InjectRepository(Question) private readonly questions: Repository<Question>,
    @InjectRepository(Submission) private readonly submissions: Repository<Submission>,
  ) {}

  async list(role?: UserRole) {
    const canManage = role && [UserRole.INSTRUCTOR, UserRole.ADMIN].includes(role);
    const quizzes = await this.quizzes.find({
      where: canManage ? {} : { status: QuizStatus.PUBLISHED },
      relations: { questions: true },
      order: { createdAt: 'DESC' },
    });
    return quizzes.map((q) => this.serialize(q));
  }

  private serialize(q: Quiz) {
    return {
      id: q.id,
      title: q.title,
      courseId: q.courseId,
      status: q.status,
      questionCount: q.questions?.length ?? 0,
      createdAt: q.createdAt,
    };
  }

  async findOne(id: number) {
    const quiz = await this.quizzes.findOne({
      where: { id },
      relations: { questions: true },
    });
    if (!quiz) throw new NotFoundException('测验不存在');
    return quiz;
  }

  async create(dto: CreateQuizDto) {
    const quiz = await this.quizzes.save(
      this.quizzes.create({
        title: dto.title,
        courseId: dto.courseId ?? null,
        status: QuizStatus.DRAFT,
      }),
    );
    const questions = dto.questions.map((q) =>
      this.questions.create({
        quizId: quiz.id,
        content: q.content,
        options: q.options,
        answer: q.answer.toUpperCase(),
      }),
    );
    await this.questions.save(questions);
    return this.findOne(quiz.id);
  }

  async publish(id: number) {
    const quiz = await this.findOne(id);
    quiz.status = QuizStatus.PUBLISHED;
    await this.quizzes.save(quiz);
    return this.findOne(id);
  }

  async submit(userId: number, id: number, dto: SubmitQuizDto) {
    const quiz = await this.findOne(id);
    const total = quiz.questions.length;
    let score = 0;
    quiz.questions.forEach((q, i) => {
      const given = (dto.answers[i] || '').toUpperCase();
      if (given === q.answer.toUpperCase()) score += 1;
    });
    return this.submissions.save(
      this.submissions.create({
        quizId: id,
        userId,
        score,
        total,
        answers: dto.answers,
        feedback: null,
      }),
    );
  }

  async listSubmissions() {
    return this.submissions.find({
      relations: { quiz: { questions: true }, user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async listMySubmissions(userId: number) {
    return this.submissions.find({
      where: { userId },
      relations: { quiz: { questions: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async addFeedback(id: number, dto: FeedbackDto) {
    const submission = await this.submissions.findOne({
      where: { id },
      relations: { quiz: true, user: true },
    });
    if (!submission) throw new NotFoundException('提交记录不存在');
    submission.feedback = dto.feedback;
    return this.submissions.save(submission);
  }
}
