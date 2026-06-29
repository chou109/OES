package com.oes.task;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.oes.entity.ExamExam;
import com.oes.entity.ExamExamRecord;
import com.oes.service.ExamExamRecordService;
import com.oes.service.ExamExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ExamStatusTask {

    @Autowired
    private ExamExamService examExamService;

    @Autowired
    private ExamExamRecordService examExamRecordService;

    /**
     * 每分钟检查一次考试状态
     * 1. 将结束时间已到的考试状态更新为 FINISHED
     * 2. 自动收卷未提交的考试记录
     */
    @Scheduled(cron = "0 * * * * ?")
    public void updateExamStatus() {
        LocalDateTime now = LocalDateTime.now();

        // 查找所有结束时间已到但状态不是 FINISHED 的考试
        List<ExamExam> finishedExams = examExamService.list(
                new LambdaQueryWrapper<ExamExam>()
                        .lt(ExamExam::getEndTime, now)
                        .ne(ExamExam::getStatus, "FINISHED")
        );

        for (ExamExam exam : finishedExams) {
            exam.setStatus("FINISHED");
            examExamService.updateById(exam);

            // 自动收卷该考试下所有未提交的记录
            List<ExamExamRecord> ongoingRecords = examExamRecordService.list(
                    new LambdaQueryWrapper<ExamExamRecord>()
                            .eq(ExamExamRecord::getExamId, exam.getId())
                            .eq(ExamExamRecord::getStatus, "ONGOING")
            );

            for (ExamExamRecord record : ongoingRecords) {
                record.setIsAutoSubmit(1);
                examExamRecordService.submitExam(record.getId());
            }
        }
    }
}