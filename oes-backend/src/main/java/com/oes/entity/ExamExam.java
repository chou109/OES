package com.oes.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.oes.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("exam_exam")
public class ExamExam extends BaseEntity {
    private String title;
    private Long paperId;
    private Long subjectId;
    private String examType;
    private java.time.LocalDateTime startTime;
    private java.time.LocalDateTime endTime;
    private Integer duration;
    private Integer totalScore;
    private Integer passScore;
    private String classIds;
    private String studentIds;
    private String status;
    private String antiCheatConfig;
    private Integer autoSubmit;
}
