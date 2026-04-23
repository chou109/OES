package com.oes.common.base;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class R<T> implements Serializable {
    private Integer code;
    private String message;
    private T data;

    public static <T> R<T> ok() {
        return new R<>(200, "操作成功", null);
    }

    public static <T> R<T> ok(T data) {
        return new R<>(200, "操作成功", data);
    }

    public static <T> R<T> ok(String message, T data) {
        return new R<>(200, message, data);
    }

    public static <T> R<T> error() {
        return new R<>(500, "操作失败", null);
    }

    public static <T> R<T> error(String message) {
        return new R<>(500, message, null);
    }

    public static <T> R<T> error(Integer code, String message) {
        return new R<>(code, message, null);
    }

    public static <T> R<T> unauthorized() {
        return new R<>(401, "未授权", null);
    }

    public static <T> R<T> forbidden() {
        return new R<>(403, "禁止访问", null);
    }

    public static <T> R<T> notFound() {
        return new R<>(404, "资源不存在", null);
    }
}
