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

    public PageResult<Map<String, Object>> studentPageWithStatus(Integer current, Integer size, Long studentId, String keyword, String status) {
        System.out.println("========== 学生考试列表查询调试 ==========");
        System.out.println("学生ID: " + studentId);
        System.out.println("分页: current=" + current + ", size=" + size);
        System.out.println("关键词: " + keyword);
        System.out.println("状态筛选: " + status);
        
        // 获取学生的考试记录（考试发布时会为每个学生创建记录）
        List<ExamExamRecord> studentRecords = examExamRecordService.getByStudentId(studentId);
        System.out.println("该学生的考试记录数量: " + (studentRecords != null ? studentRecords.size() : 0));
        if (studentRecords != null) {
            for (ExamExamRecord record : studentRecords) {
                System.out.println("  考试记录: examId=" + record.getExamId() + ", status=" + record.getStatus());
            }
        }
        
        if (studentRecords == null || studentRecords.isEmpty()) {
            System.out.println("没有考试记录，返回空列表");
            return new PageResult<>(0L, new ArrayList<>(), (long) current, (long) size);
        }
        
        List<Long> examIds = studentRecords.stream().map(ExamExamRecord::getExamId).collect(Collectors.toList());
        System.out.println("学生的考试IDs: " + examIds);
        
        Page<ExamExam> page = new Page<>(current, size);
        LambdaQueryWrapper<ExamExam> wrapper = new LambdaQueryWrapper<>();
        
        // 只查询学生有考试记录的考试
        wrapper.in(ExamExam::getId, examIds);
        
        // 状态筛选
        if (StringUtils.hasText(status)) {
            System.out.println("应用状态筛选: " + status);
            wrapper.eq(ExamExam::getStatus, status);
        } else {
            System.out.println("没有指定状态筛选，显示所有状态");
        }
        
        // 关键词搜索
        if (StringUtils.hasText(keyword)) {
            System.out.println("应用关键词搜索: " + keyword);
            wrapper.like(ExamExam::getTitle, keyword);
        }
        
        wrapper.orderByDesc(ExamExam::getCreateTime);
        IPage<ExamExam> result = page(page, wrapper);
        
        System.out.println("查询到的考试数量: " + result.getRecords().size());
        for (ExamExam exam : result.getRecords()) {
            System.out.println("  考试: id=" + exam.getId() + ", title=" + exam.getTitle() + ", status=" + exam.getStatus());
        }
        
        // 使用Map提高查找效率
        Map<Long, ExamExamRecord> recordMap = studentRecords.stream()
                .collect(Collectors.toMap(ExamExamRecord::getExamId, r -> r));
        
        List<Map<String, Object>> resultList = new ArrayList<>();
        for (ExamExam exam : result.getRecords()) {
            Map<String, Object> map = new HashMap<>();
            map.put("exam", exam);
            
            ExamExamRecord record = recordMap.get(exam.getId());
            if (record != null) {
                if ("SUBMITTED".equals(record.getStatus())) {
                    map.put("studentStatus", "SUBMITTED");
                } else if ("AUTO_SUBMITTED".equals(record.getStatus())) {
                    map.put("studentStatus", "AUTO_SUBMITTED");
                } else if ("ONGOING".equals(record.getStatus())) {
                    map.put("studentStatus", "ONGOING");
                } else {
                    map.put("studentStatus", "NOT_STARTED");
                }
            } else {
                map.put("studentStatus", "NOT_STARTED");
            }
            resultList.add(map);
        }
        
        System.out.println("返回给前端的考试数量: " + resultList.size());
        System.out.println("========== 查询完成 ==========");
        
        return new PageResult<>(result.getTotal(), resultList, (long) current, (long) size);
    }

    @Transactional
    public boolean createExam(ExamExam exam) {
        exam.setStatus("PENDING");
        boolean created = save(exam);
        if (created) {
            // 创建成功后自动发布考试（为学生创建考试记录）
            publishExam(exam.getId());
        }
        return created;
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
        
        System.out.println("========== 发布考试调试 ==========");
        System.out.println("考试ID: " + examId);
        System.out.println("考试标题: " + exam.getTitle());
        System.out.println("班级IDs: " + exam.getClassIds());
        
        List<Long> classIds = getClassIds(exam);
        System.out.println("解析后的班级ID列表: " + classIds);
        
        if (classIds.isEmpty()) {
            throw new RuntimeException("请先选择发布班级");
        }
        
        Set<Long> studentIds = new HashSet<>();
        for (Long classId : classIds) {
            System.out.println("查询班级 " + classId + " 的成员...");
            List<SysClassMember> members = sysClassMemberService.getMembersByClassId(classId);
            System.out.println("班级 " + classId + " 成员数量: " + (members != null ? members.size() : 0));
            if (members != null) {
                for (SysClassMember member : members) {
                    System.out.println("  成员: userId=" + member.getUserId() + ", role=" + member.getRole());
                    if ("STUDENT".equals(member.getRole()) || "MEMBER".equals(member.getRole())) {
                        studentIds.add(member.getUserId());
                    }
                }
            }
        }
        
        System.out.println("找到的学生IDs: " + studentIds);
        
        if (studentIds.isEmpty()) {
            throw new RuntimeException("所选班级没有学生");
        }
        
        exam.setStudentIds(studentIds.stream().map(String::valueOf).collect(Collectors.joining(",")));
        exam.setStatus("PENDING");
        boolean updated = updateById(exam);
        System.out.println("更新考试结果: " + updated);
        
        if (updated) {
            int createdCount = 0;
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
                    createdCount++;
                    System.out.println("为学生 " + studentId + " 创建考试记录成功");
                } else {
                    System.out.println("学生 " + studentId + " 已有考试记录，跳过");
                }
            }
            System.out.println("共创建考试记录: " + createdCount + " 条");
        }
        System.out.println("========== 发布考试完成 ==========");
        
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

    public boolean extendExam(Long examId, Integer minutes) {
        ExamExam exam = getById(examId);
        if (exam == null) {
            throw new RuntimeException("考试不存在");
        }
        exam.setEndTime(exam.getEndTime().plusMinutes(minutes));
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
        ExamStatistics stats = examStatisticsMapper.selectOne(
                new LambdaQueryWrapper<ExamStatistics>().eq(ExamStatistics::getExamId, examId));
        if (stats == null) {
            stats = new ExamStatistics();
            stats.setExamId(examId);
            stats.setTotalStudents(0);
            stats.setSubmittedCount(0);
            stats.setAvgScore(java.math.BigDecimal.ZERO);
            stats.setMaxScore(0);
            stats.setMinScore(0);
            stats.setPassRate(java.math.BigDecimal.ZERO);
            stats.setSuspiciousCount(0);
        }
        return stats;
    }

    public Long countParticipation() {
        return examExamRecordService.count(new LambdaQueryWrapper<ExamExamRecord>()
                .in(ExamExamRecord::getStatus, Arrays.asList("SUBMITTED", "AUTO_SUBMITTED")));
    }
}