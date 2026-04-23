package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oes.common.base.PageResult;
import com.oes.entity.*;
import com.oes.mapper.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ExamExamRecordService extends ServiceImpl<ExamExamRecordMapper, ExamExamRecord> {

    private final ExamAnswerMapper examAnswerMapper;
    private final ExamQuestionService examQuestionService;
    private final ExamWrongQuestionMapper examWrongQuestionMapper;
    private final ExamStatisticsMapper examStatisticsMapper;
    private final SysUserService sysUserService;

    public ExamExamRecordService(ExamAnswerMapper examAnswerMapper,
                                  ExamQuestionService examQuestionService,
                                  ExamWrongQuestionMapper examWrongQuestionMapper,
                                  ExamStatisticsMapper examStatisticsMapper,
                                  SysUserService sysUserService) {
        this.examAnswerMapper = examAnswerMapper;
        this.examQuestionService = examQuestionService;
        this.examWrongQuestionMapper = examWrongQuestionMapper;
        this.examStatisticsMapper = examStatisticsMapper;
        this.sysUserService = sysUserService;
    }

    public PageResult<ExamExamRecord> page(Integer current, Integer size, Long examId, Long studentId, String status) {
        Page<ExamExamRecord> page = new Page<>(current, size);
        LambdaQueryWrapper<ExamExamRecord> wrapper = new LambdaQueryWrapper<>();
        if (examId != null) {
            wrapper.eq(ExamExamRecord::getExamId, examId);
        }
        if (studentId != null) {
            wrapper.eq(ExamExamRecord::getStudentId, studentId);
        }
        if (StringUtils.hasText(status)) {
            wrapper.eq(ExamExamRecord::getStatus, status);
        }
        wrapper.orderByDesc(ExamExamRecord::getCreateTime);
        IPage<ExamExamRecord> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords(), (long) current, (long) size);
    }

    public ExamExamRecord getByExamAndStudent(Long examId, Long studentId) {
        return getOne(new LambdaQueryWrapper<ExamExamRecord>()
                .eq(ExamExamRecord::getExamId, examId)
                .eq(ExamExamRecord::getStudentId, studentId));
    }

    @Transactional
    public ExamExamRecord startExam(Long examId, Long studentId, Long paperId,
                                     String questionOrder, String optionOrder) {
        ExamExamRecord record = new ExamExamRecord();
        record.setExamId(examId);
        record.setStudentId(studentId);
        record.setPaperId(paperId);
        record.setStartTime(LocalDateTime.now());
        record.setQuestionOrder(questionOrder);
        record.setOptionOrder(optionOrder);
        record.setScreenSwitchCount(0);
        record.setIsSuspicious(0);
        record.setIsAutoSubmit(0);
        record.setStatus("ONGOING");
        save(record);
        return record;
    }

    @Transactional
    public void saveAnswer(Long recordId, Long studentId, Long questionId, String answer) {
        ExamAnswer examAnswer = getAnswer(recordId, questionId);
        if (examAnswer == null) {
            examAnswer = new ExamAnswer();
            examAnswer.setRecordId(recordId);
            examAnswer.setQuestionId(questionId);
            examAnswer.setStudentId(studentId);
            examAnswer.setAnswer(answer);
            examAnswerMapper.insert(examAnswer);
        } else {
            examAnswer.setAnswer(answer);
            examAnswerMapper.updateById(examAnswer);
        }
    }

    public ExamAnswer getAnswer(Long recordId, Long questionId) {
        return examAnswerMapper.selectOne(new LambdaQueryWrapper<ExamAnswer>()
                .eq(ExamAnswer::getRecordId, recordId)
                .eq(ExamAnswer::getQuestionId, questionId));
    }

    public List<ExamAnswer> getAnswersByRecordId(Long recordId) {
        return examAnswerMapper.selectList(new LambdaQueryWrapper<ExamAnswer>()
                .eq(ExamAnswer::getRecordId, recordId));
    }

    @Transactional
    public void submitExam(Long recordId) {
        ExamExamRecord record = getById(recordId);
        if (record == null) {
            throw new RuntimeException("考试记录不存在");
        }
        record.setSubmitTime(LocalDateTime.now());
        record.setStatus("SUBMITTED");
        updateById(record);

        autoGrade(recordId);
        calculateStatistics(record.getExamId());
    }

    @Transactional
    public void autoGrade(Long recordId) {
        ExamExamRecord record = getById(recordId);
        if (record == null) return;

        List<ExamAnswer> answers = getAnswersByRecordId(recordId);
        int totalScore = 0;

        for (ExamAnswer answer : answers) {
            ExamQuestion question = examQuestionService.getById(answer.getQuestionId());
            if (question == null) continue;

            if (isObjective(question.getType())) {
                boolean correct = gradeAnswer(question, answer);
                answer.setIsCorrect(correct ?1 : 0);
                answer.setAutoScore(correct ? question.getScore() : 0);

                if (!correct) {
                    saveWrongQuestion(record.getStudentId(), question, answer.getAnswer(), record.getExamId());
                } else {
                    examQuestionService.incrementCorrectCount(question.getId());
                }
            }
            examAnswerMapper.updateById(answer);
            totalScore += answer.getAutoScore() != null ? answer.getAutoScore() : 0;
        }

        record.setScore(totalScore);
        record.setScoreStatus("AUTO_MARKED");
        updateById(record);
    }

    private boolean isObjective(String type) {
        return "SINGLE_CHOICE".equals(type) ||
               "MULTIPLE_CHOICE".equals(type) ||
               "JUDGMENT".equals(type);
    }

    private boolean gradeAnswer(ExamQuestion question, ExamAnswer answer) {
        if (question.getAnswer() == null || answer.getAnswer() == null) {
            return false;
        }
        String correct = question.getAnswer().trim().toUpperCase();
        String student = answer.getAnswer().trim().toUpperCase();
        return correct.equals(student);
    }

    private void saveWrongQuestion(Long studentId, ExamQuestion question, String wrongAnswer, Long examId) {
        ExamWrongQuestion wrongQuestion = new ExamWrongQuestion();
        wrongQuestion.setStudentId(studentId);
        wrongQuestion.setQuestionId(question.getId());
        wrongQuestion.setExamId(examId);
        wrongQuestion.setWrongAnswer(wrongAnswer);
        wrongQuestion.setCorrectAnswer(question.getAnswer());
        wrongQuestion.setPracticedCount(0);
        examWrongQuestionMapper.insert(wrongQuestion);
    }

    public void incrementScreenSwitch(Long recordId) {
        ExamExamRecord record = getById(recordId);
        if (record != null) {
            record.setScreenSwitchCount(record.getScreenSwitchCount() + 1);
            if (record.getScreenSwitchCount() >= 3) {
                record.setIsSuspicious(1);
            }
            updateById(record);
        }
    }

    public void autoSubmitIfTimeout(Long recordId) {
        ExamExamRecord record = getById(recordId);
        if (record != null && "ONGOING".equals(record.getStatus())) {
            record.setIsAutoSubmit(1);
            updateById(record);
            submitExam(recordId);
        }
    }

    private void calculateStatistics(Long examId) {
        List<ExamExamRecord> records = list(new LambdaQueryWrapper<ExamExamRecord>()
                .eq(ExamExamRecord::getExamId, examId)
                .eq(ExamExamRecord::getStatus, "SUBMITTED"));

        if (records.isEmpty()) return;

        int total = records.size();
        int submitted = records.size();
        double avg = records.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).average().orElse(0);
        int max = records.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).max().orElse(0);
        int min = records.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).min().orElse(0);
        long pass = records.stream().filter(r -> r.getScore() != null && r.getScore() >= 60).count();
        BigDecimal passRate = BigDecimal.valueOf((double) pass / total * 100);
        int suspicious = (int) records.stream().filter(r -> r.getIsSuspicious() != null && r.getIsSuspicious() ==1).count();

        ExamStatistics stats = examStatisticsMapper.selectOne(
                new LambdaQueryWrapper<ExamStatistics>().eq(ExamStatistics::getExamId, examId));

        if (stats == null) {
            stats = new ExamStatistics();
            stats.setExamId(examId);
        }
        stats.setTotalStudents(total);
        stats.setSubmittedCount(submitted);
        stats.setAvgScore(BigDecimal.valueOf(avg));
        stats.setMaxScore(max);
        stats.setMinScore(min);
        stats.setPassRate(passRate);
        stats.setSuspiciousCount(suspicious);

        if (stats.getId() == null) {
            examStatisticsMapper.insert(stats);
        } else {
            examStatisticsMapper.updateById(stats);
        }
    }

    public Map<String, Object> getExamAnalysis(Long examId) {
        Map<String, Object> analysis = new HashMap<>();

        List<ExamExamRecord> records = list(new LambdaQueryWrapper<ExamExamRecord>()
                .eq(ExamExamRecord::getExamId, examId)
                .eq(ExamExamRecord::getStatus, "SUBMITTED"));

        if (!records.isEmpty()) {
            double avg = records.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).average().orElse(0);
            int max = records.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).max().orElse(0);
            int min = records.stream().mapToInt(r -> r.getScore() != null ? r.getScore() : 0).min().orElse(0);
            long pass = records.stream().filter(r -> r.getScore() != null && r.getScore() >= 60).count();

            analysis.put("totalStudents", records.size());
            analysis.put("avgScore", avg);
            analysis.put("maxScore", max);
            analysis.put("minScore", min);
            analysis.put("passRate", (double) pass / records.size() * 100);
        }

        return analysis;
    }
}