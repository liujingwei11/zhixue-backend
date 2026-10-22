import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../courses/course.entity';
import { CourseStatus, EnrollmentStatus } from '../common/enums';
import { Enrollment } from './enrollment.entity';
import { ProgressRecord } from '../progress/progress-record.entity';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { calculateProgress } from '../common/progress';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(ProgressRecord) private readonly progress: Repository<ProgressRecord>,
  ) {}

  async enroll(userId: number, courseId: number) {
    const course = await this.courses.findOne({ where: { id: courseId }, relations: { lessons: true } });
    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new NotFoundException('Published course not found');
    }
    const duplicate = await this.enrollments.findOne({ where: { userId, courseId } });
    if (duplicate) throw new ConflictException('Duplicate enrollment is not allowed');
    const enrollment = await this.enrollments.save(this.enrollments.create({
      userId, courseId, progressPercent: 0, status: EnrollmentStatus.ACTIVE,
    }));
    const progress = await this.progress.save(this.progress.create({
      enrollmentId: enrollment.id, completedLessons: 0,
      totalLessons: course.lessons?.length ?? 0, progressPercent: 0, lastStudyAt: null,
    }));
    return this.findOne(userId, enrollment.id, progress);
  }

  async listMine(userId: number) {
    return this.enrollments.find({
      where: { userId },
      relations: { course: { lessons: true }, progress: true },
      order: { enrolledAt: 'DESC' },
    });
  }

  async findOne(userId: number, id: number, knownProgress?: ProgressRecord) {
    const enrollment = await this.enrollments.findOne({
      where: { id, userId },
      relations: { course: { lessons: true }, progress: true },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (knownProgress) enrollment.progress = knownProgress;
    return enrollment;
  }

  async updateProgress(userId: number, id: number, dto: UpdateProgressDto) {
    const enrollment = await this.findOne(userId, id);
    const liveTotal = enrollment.course?.lessons?.length ?? 0;
    const total = liveTotal > 0 ? liveTotal : (enrollment.progress?.totalLessons ?? 0);
    const completed = Math.min(dto.completedLessons, total);
    const percent = calculateProgress(completed, total);
    enrollment.progressPercent = percent;
    enrollment.status = percent >= 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE;
    await this.enrollments.save(enrollment);
    const record = enrollment.progress ?? this.progress.create({ enrollmentId: id, totalLessons: total });
    record.completedLessons = completed;
    record.totalLessons = total;
    record.progressPercent = percent;
    record.lastStudyAt = new Date();
    await this.progress.save(record);
    return this.findOne(userId, id);
  }
}
