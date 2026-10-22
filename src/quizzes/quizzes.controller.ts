import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../common/auth.decorators';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '../common/enums';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { FeedbackDto } from './dto/feedback.dto';

@ApiTags('quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Get()
  list(@CurrentUser() user: { role: UserRole }) {
    return this.quizzes.list(user.role);
  }

  @Get('submissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  submissions() {
    return this.quizzes.listSubmissions();
  }

  @Get('my-submissions')
  mySubmissions(@CurrentUser() user: { id: number }) {
    return this.quizzes.listMySubmissions(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quizzes.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  create(@Body() dto: CreateQuizDto) {
    return this.quizzes.create(dto);
  }

  @Post(':id/publish')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.quizzes.publish(id);
  }

  @Post(':id/submit')
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitQuizDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.quizzes.submit(user.id, id, dto);
  }

  @Patch('submissions/:id/feedback')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  feedback(@Param('id', ParseIntPipe) id: number, @Body() dto: FeedbackDto) {
    return this.quizzes.addFeedback(id, dto);
  }
}
