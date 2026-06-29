package com.oes.config;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public Object handleException(Exception e) {
        System.out.println("========== GlobalExceptionHandler caught exception ==========");
        e.printStackTrace();
        System.out.println("===========================================================");
        return com.oes.common.base.R.error(500, "服务器错误: " + e.getMessage());
    }
}
