package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oes.common.base.PageResult;
import com.oes.entity.ExamExam;
import com.oes.entity.ExamStatistics;
import com.oes.mapper.ExamExamMapper;
import com.oes.mapper.ExamStatisticsMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExamExamService extends ServiceImpl<ExamExamMapper, ExamExam> {

    private final ExamStatisticsMapper examStatisticsMapper;

    public ExamExamService(ExamStatisticsMapper examStatisticsMapper) {
        this.examStatisticsMapper = examStatisticsMapper;
    }

    public PageResult<ExamExam> page(Integer current, Integer size, Long subjectId, String status, String keyword) {
        Page<ExamExam> page = new Page<>(current, size);
        LambdaQueryWrapper<ExamExam> wrapper = new LambdaQueryWrapper<>();
        if (subjectId != null) {
            wrapper.eq(ExamExam::getSubjectId, subjectId);
        }
        if (StringUtils.hasText(status)) {
            wrapper.eq(ExamExam::getStatus, status);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(ExamExam::getTitle, keyword);
        }
        wrapper.orderByDesc(ExamExam::getCreateTime);
        IPage<ExamExam> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords(), (long) current, (long) size);
    }

    public PageResult<ExamExam> studentPage(Integer current, Integer size, Long studentId, String status) {
        Page<ExamExam> page = new Page<>(current, size);
        LambdaQueryWrapper<ExamExam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExamExam::getStatus, "ONGOING");
        wrapper.or(w -> w.eq(ExamExam::getStatus, "PENDING")
                .gt(ExamExam::getEndTime, LocalDateTime.now()));
        if (StringUtils.hasText(status)) {
            wrapper.eq(ExamExam::getStatus, status);
        }
        wrapper.orderByAsc(ExamExam::getStartTime);
        IPage<ExamExam> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getRecords(), (long) current, (long) size);
    }

    public boolean createExam(ExamExam exam) {
        exam.setStatus("PENDING");
        return save(exam);
    }

    public boolean updateExam(ExamExam exam) {
        return updateById(exam);
    }

    public boolean publishExam(Long examId) {
        ExamExam exam = getById(examId);
        if (exam == null) {
            throw new RuntimeException("考试不存在");
        }
        exam.setStatus("PENDING");
        return updateById(exam);
    }

    public boolean startExam(Long examId) {
        ExamExam exam = getById(examId);
        if (exam == null) {
            throw new RuntimeException("考试不存在");
        }
        exam.setStatus("ONGOING");
        return updateById(exam);
    }

    public boolean finishExam(Long examId) {
        ExamExam exam = getById(examId);
        if (exam == null) {
            throw new RuntimeException("考试不存在");
        }
        exam.setStatus("FINISHED");
        return updateById(exam);
    }

    public boolean extendTime(Long examId, Integer extraMinutes) {
        ExamExam exam = getById(examId);
        if (exam == null) {
            throw new RuntimeException("考试不存在");
        }
        exam.setDuration(exam.getDuration() + extraMinutes);
        return updateById(exam);
    }

    public List<Long> getClassIds(ExamExam exam) {
        if (!StringUtils.hasText(exam.getClassIds())) {
            return List.of();
        }
        return Arrays.stream(exam.getClassIds().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }

    public Long countByStatus(String status) {
        return count(new LambdaQueryWrapper<ExamExam>().eq(ExamExam::getStatus, status));
    }

    public ExamStatistics getStatistics(Long examId) {
        return examStatisticsMapper.selectOne(
                new LambdaQueryWrapper<ExamStatistics>().eq(ExamStatistics::getExamId, examId));
    }
}