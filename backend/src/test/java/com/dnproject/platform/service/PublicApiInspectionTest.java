package com.dnproject.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Set;
import java.util.TreeSet;

public class PublicApiInspectionTest {

    private static final String SERVICE_KEY = "3f6a71b1bf37087b7bf177c8f48e9e47348cfcfb7a894109c239f59082c5d69e";
    private static final String BASE_URL = "https://apis.data.go.kr/1543061/abandonmentPublicService_v2/abandonmentPublic_v2";

    @Test
    void analyzeProcessStates() {
        System.out.println(">>> Start Status Analysis <<<");
        try {
            String uri = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                    .queryParam("serviceKey", SERVICE_KEY)
                    .queryParam("pageNo", 1)
                    .queryParam("numOfRows", 1000)
                    .queryParam("_type", "json")
                    .build()
                    .toUriString();

            System.out.println("Fetching 1000 items...");

            // Increase buffer size to 10MB
            final int size = 10 * 1024 * 1024;
            ExchangeStrategies strategies = ExchangeStrategies.builder()
                    .codecs(codecs -> codecs.defaultCodecs().maxInMemorySize(size))
                    .build();

            WebClient webClient = WebClient.builder()
                    .exchangeStrategies(strategies)
                    .build();

            String json = webClient.get().uri(uri).retrieve().bodyToMono(String.class).block();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);
            JsonNode items = root.path("response").path("body").path("items").path("item");

            // TreeSet for sorting
            Set<String> states = new TreeSet<>();
            int count = 0;

            if (items.isArray()) {
                count = items.size();
                for (JsonNode item : items) {
                    if (item.has("processState")) {
                        states.add(item.get("processState").asText());
                    }
                }
            } else if (items.isObject()) {
                count = 1;
                if (items.has("processState")) {
                    states.add(items.get("processState").asText());
                }
            }

            System.out.println(">>> Distinct Process States (Found from " + count + " items) <<<");
            for (String state : states) {
                System.out.println("- " + state);
            }

        } catch (Exception e) {
            System.err.println("Analysis Failed: " + e.getMessage());
            e.printStackTrace();
        }
        System.out.println(">>> End Analysis <<<");
    }
}
