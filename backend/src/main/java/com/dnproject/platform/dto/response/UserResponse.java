package com.dnproject.platform.dto.response;

import com.dnproject.platform.domain.constant.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private Role role;
    private java.time.Instant createdAt;
}
