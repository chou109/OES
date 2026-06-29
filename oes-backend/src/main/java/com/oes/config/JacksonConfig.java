package com.oes.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Configuration
public class JacksonConfig {

    private static final String DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    private static final ZoneId ASIA_SHANGHAI = ZoneId.of("Asia/Shanghai");

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        JavaTimeModule module = new JavaTimeModule();
        
        // 自定义LocalDateTime序列化器 - 输出带时区的格式
        module.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(DateTimeFormatter.ofPattern(DATE_TIME_FORMAT)));
        
        // 自定义LocalDateTime反序列化器 - 处理带时区的输入
        module.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer() {
            @Override
            public LocalDateTime deserialize(com.fasterxml.jackson.core.JsonParser p, 
                                             com.fasterxml.jackson.databind.DeserializationContext ctxt) 
                    throws java.io.IOException {
                String value = p.getText();
                try {
                    // 尝试解析带时区的格式
                    if (value != null && value.contains("Z")) {
                        // 处理 ISO 8601 格式（带Z结尾）
                        ZonedDateTime zdt = ZonedDateTime.parse(value);
                        return zdt.withZoneSameInstant(ASIA_SHANGHAI).toLocalDateTime();
                    } else if (value != null && value.contains("T")) {
                        // 处理带T分隔符但不带时区的格式
                        LocalDateTime ldt = LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                        return ldt;
                    } else {
                        // 处理普通格式
                        return LocalDateTime.parse(value, DateTimeFormatter.ofPattern(DATE_TIME_FORMAT));
                    }
                } catch (Exception e) {
                    // 如果解析失败，使用默认行为
                    return super.deserialize(p, ctxt);
                }
            }
        });
        
        mapper.registerModule(module);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        return mapper;
    }
}
