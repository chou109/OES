package com.oes.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.oes.common.base.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("exam_exam_record")
public class ExamExamRecord extends BaseEntity {
    private Long examId;
    private Long studentId;
    private Long paperId;
    private java.time.LocalDateTime startTime;
    private java.time.LocalDateTime submitTime;
    private Integer score;
    private String scoreStatus;
    private String answerData;
    private String questionOrder;
    private String optionOrder;
    private Integer screenSwitchCount;
    private Integer isSuspicious;
    private Integer isAutoSubmit;
    private String status;
}
