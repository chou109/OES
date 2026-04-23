package com.oes.interceptor;

import com.oes.config.JwtUtils;
import com.oes.service.SysLogService;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtils jwtUtils;
    private final SysLogService sysLogService;

    public AuthInterceptor(JwtUtils jwtUtils, SysLogService sysLogService) {
        this.jwtUtils = jwtUtils;
        this.sysLogService = sysLogService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }

        String token = request.getHeader("Authorization");
        if (token == null || !token.startsWith("Bearer ")) {
            response.setStatus(401);
            return false;
        }

        token = token.replace("Bearer ", "");
        if (!jwtUtils.validateToken(token)) {
            response.setStatus(401);
            return false;
        }

        String username = jwtUtils.getUsernameFromToken(token);
        request.setAttribute("userId", jwtUtils.getUserIdFromToken(token));
        request.setAttribute("username", username);
        request.setAttribute("role", jwtUtils.getRoleFromToken(token));

        sysLogService.saveLog(username, request.getMethod(), request.getRequestURI(),
                "", request.getRemoteAddr());

        return true;
    }
}
