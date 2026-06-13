package com.oes.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oes.annotation.Log;
import com.oes.entity.SysLog;
import com.oes.service.SysLogService;
import javax.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
public class LogAspect {

    private final SysLogService sysLogService;
    private final ObjectMapper objectMapper;

    public LogAspect(SysLogService sysLogService, ObjectMapper objectMapper) {
        this.sysLogService = sysLogService;
        this.objectMapper = objectMapper;
    }

    @Pointcut("@annotation(com.oes.annotation.Log)")
    public void logPointcut() {}

    @Around("logPointcut()")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String methodName = signature.getName();
        
        // 只记录增删改操作，不记录查询操作
        if (!isDataModification(methodName)) {
            return joinPoint.proceed();
        }
        
        Log logAnnotation = method.getAnnotation(Log.class);
        String operation = logAnnotation.operation();
        
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String ip = getClientIp(request);
        String username = getCurrentUsername(request);
        String params = getParams(joinPoint, signature);
        
        Object result = joinPoint.proceed();
        
        try {
            SysLog sysLog = new SysLog();
            sysLog.setUsername(username);
            sysLog.setOperation(operation);
            sysLog.setMethod(methodName);
            sysLog.setParams(params);
            sysLog.setIp(ip);
            sysLogService.save(sysLog);
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return result;
    }
    
    private boolean isDataModification(String methodName) {
        String lowerName = methodName.toLowerCase();
        // 新增操作
        if (lowerName.contains("create") || lowerName.contains("add") || 
            lowerName.contains("insert") || lowerName.contains("save")) {
            return true;
        }
        // 修改操作
        if (lowerName.contains("update") || lowerName.contains("edit") || 
            lowerName.contains("modify")) {
            return true;
        }
        // 删除操作
        if (lowerName.contains("delete") || lowerName.contains("remove") || 
            lowerName.contains("del")) {
            return true;
        }
        return false;
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private String getCurrentUsername(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            try {
                String payload = token.split("\\.")[1];
                byte[] decoded = java.util.Base64.getUrlDecoder().decode(payload);
                Map<String, Object> claims = objectMapper.readValue(decoded, Map.class);
                return (String) claims.get("username");
            } catch (Exception e) {
                return "anonymous";
            }
        }
        return "anonymous";
    }

    private String getParams(ProceedingJoinPoint joinPoint, MethodSignature signature) {
        try {
            String[] paramNames = signature.getParameterNames();
            Object[] paramValues = joinPoint.getArgs();
            Map<String, Object> params = new HashMap<>();
            for (int i = 0; i < paramNames.length; i++) {
                Object value = paramValues[i];
                if (value != null && !value.getClass().getName().startsWith("jakarta.servlet")) {
                    params.put(paramNames[i], value);
                }
            }
            return objectMapper.writeValueAsString(params);
        } catch (Exception e) {
            return "";
        }
    }
}
