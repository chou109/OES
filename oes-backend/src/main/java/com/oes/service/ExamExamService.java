package com.oes.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.oes.common.base.PageResult;
import com.oes.entity.ExamExam;
import com.oes.entity.ExamExamRecord;
import com.oes.entity.ExamStatistics;
import com.oes.entity.SysClassMember;
import com.oes.mapper.ExamExamMapper;
import com.oes.mapper.ExamStatisticsMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExamExamService extends ServiceImpl<ExamExamMapper, ExamExam> {

    private final ExamStatisticsMapper examStatisticsMapper;
    private final ExamExamRecordService examExamRecordService;
    private final SysClassMemberService sysClassMemberService;

    public ExamExamService(ExamStatisticsMapper examStatisticsMapper,
                          ExamExamRecordService examExamRecordService,
                          SysClassMemberService sysClassMemberService) {
        this.examStatisticsMapper = examStatisticsMapper;
        this.examExamRecordService = examExamRecordService;
        this.sysClassMemberService = sysClassMemberService;
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

    public PageResult<Map<String, Object>> studentPageWithStatus(Integer current, Integer size, Long studentId) {
        Page<ExamExam> page = new Page<>(current, size);
        LambdaQueryWrapper<ExamExam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExamExam::getStatus, "ONGOING");
        wrapper.or(w -> w.eq(ExamExam::getStatus, "PENDING")
                .gt(ExamExam::getEndTime, LocalDateTime.now()));
        wrapper.orderByAsc(ExamExam::getStartTime);
        IPage<ExamExam> result = page(page, wrapper);
        
        List<Map<String, Object>> records = new ArrayList<>();
        for (ExamExam exam : result.getRecords()) {
            Map<String, Object> map = new HashMap<>();
            map.put("exam", exam);
            
            if (studentId != null) {
                ExamExamRecord record = examExamRecordService.getByExamAndStudent(exam.getId(), studentId);
                System.out.println("========== studentPageWithStatus debug ==========");
                System.out.println("examId: " + exam.getId() + ", studentId: " + studentId);
                System.out.println("record: " + (record != null ? record.getId() + ", status: " + record.getStatus() : "null"));
                if (record != null && "SUBMITTED".equals(record.getStatus())) {
                    map.put("studentStatus", "SUBMITTED");
                } else if (record != null && "ONGOING".equals(record.getStatus())) {
                    map.put("studentStatus", "ONGOING");
                } else {
                    map.put("studentStatus", "NOT_STARTED");
                }
            } else {
                System.out.println("========== studentId is null ==========");
                map.put("studentStatus", "UNKNOWN");
            }
            records.add(map);
        }
        
        return new PageResult<>(result.getTotal(), records, (long) current, (long) size);
    }

    public boolean createExam(ExamExam exam) {
        exam.setStatus("PENDING");
        return save(exam);
    }

    public boolean updateExam(ExamExam exam) {
        return updateById(exam);
    }

    @Transactional
    public boolean publishExam(Long examId) {
        ExamExam exam = getById(examId);
        if (exam == null) {
            throw new RuntimeException("考试不存在");
        }
        
        List<Long> classIds = getClassIds(exam);
        if (classIds.isEmpty()) {
            throw new RuntimeException("请先选择发布班级");
        }
        
        Set<Long> studentIds = new HashSet<>();
        for (Long classId : classIds) {
            List<SysClassMember> members = sysClassMemberService.getMembersByClassId(classId);
            for (SysClassMember member : members) {
                if ("STUDENT".equals(member.getRole()) || "MEMBER".equals(member.getRole())) {
                    studentIds.add(member.getUserId());
                }
            }
        }
        
        if (studentIds.isEmpty()) {
            throw new RuntimeException("所选班级没有学生");
        }
        
        exam.setStudentIds(studentIds.stream().map(String::valueOf).collect(Collectors.joining(",")));
        exam.setStatus("PENDING");
        boolean updated = updateById(exam);
        
        if (updated) {
            for (Long studentId : studentIds) {
                ExamExamRecord existingRecord = examExamRecordService.getByExamAndStudent(examId, studentId);
                if (existingRecord == null) {
                    ExamExamRecord record = new ExamExamRecord();
                    record.setExamId(examId);
                    record.setStudentId(studentId);
                    record.setPaperId(exam.getPaperId());
                    record.setStatus("PENDING");
                    record.setScreenSwitchCount(0);
                    record.setIsSuspicious(0);
                    record.setIsAutoSubmit(0);
                    examExamRecordService.save(record);
                }
            }
        }
        
        return updated;
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