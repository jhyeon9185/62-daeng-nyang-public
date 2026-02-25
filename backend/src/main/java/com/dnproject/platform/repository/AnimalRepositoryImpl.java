package com.dnproject.platform.repository;

import com.dnproject.platform.domain.Animal;
import com.dnproject.platform.domain.QAnimal;
import com.dnproject.platform.domain.QShelter;
import com.dnproject.platform.domain.constant.AnimalStatus;
import com.dnproject.platform.domain.constant.Size;
import com.dnproject.platform.domain.constant.Species;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

@RequiredArgsConstructor
public class AnimalRepositoryImpl implements AnimalRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Animal> findWithFilters(Species species, AnimalStatus status, Size size, String region, String sigungu,
            String search, Pageable pageable) {
        QAnimal a = QAnimal.animal;
        QShelter s = QShelter.shelter;

        BooleanBuilder builder = getCommonFilters(species, status, size, region, sigungu, search, a, s);

        List<Animal> content = queryFactory.selectFrom(a)
                .join(a.shelter, s).fetchJoin()
                .where(builder)
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory.select(a.count())
                .from(a)
                .join(a.shelter, s)
                .where(builder)
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    @Override
    public Page<Animal> findWithFiltersRandom(Species species, AnimalStatus status, Size size, String region,
            String sigungu, String search, Pageable pageable) {
        QAnimal a = QAnimal.animal;
        QShelter s = QShelter.shelter;

        BooleanBuilder builder = getCommonFilters(species, status, size, region, sigungu, search, a, s);

        List<Animal> content = queryFactory.selectFrom(a)
                .join(a.shelter, s).fetchJoin()
                .where(builder)
                .orderBy(Expressions.numberTemplate(Double.class, "function('RAND')").asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory.select(a.count())
                .from(a)
                .join(a.shelter, s)
                .where(builder)
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    @Override
    public Page<Animal> findRecommended(List<AnimalStatus> statuses, Species species, Integer minAge, Integer maxAge,
            Size size, List<String> regions, Pageable pageable) {
        QAnimal a = QAnimal.animal;
        QShelter s = QShelter.shelter;

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(a.imageUrl.isNotNull()).and(a.imageUrl.isNotEmpty());

        if (statuses != null && !statuses.isEmpty()) {
            builder.and(a.status.in(statuses));
        }
        if (species != null) {
            builder.and(a.species.eq(species));
        }
        if (minAge != null) {
            builder.and(a.age.goe(minAge));
        }
        if (maxAge != null) {
            builder.and(a.age.loe(maxAge));
        }
        if (size != null) {
            builder.and(a.size.eq(size));
        }
        if (regions != null && !regions.isEmpty()) {
            builder.and(s.regionSido.in(regions));
        }

        List<Animal> content = queryFactory.selectFrom(a)
                .join(a.shelter, s).fetchJoin()
                .where(builder)
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory.select(a.count())
                .from(a)
                .join(a.shelter, s)
                .where(builder)
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    private BooleanBuilder getCommonFilters(Species species, AnimalStatus status, Size size, String region,
            String sigungu, String search, QAnimal a, QShelter s) {
        BooleanBuilder builder = new BooleanBuilder();

        if (species != null) {
            builder.and(a.species.eq(species));
        }
        if (status != null) {
            builder.and(a.status.eq(status));
        }
        if (size != null) {
            builder.and(a.size.eq(size));
        }
        if (region != null && !region.isBlank()) {
            builder.and(s.regionSido.eq(region));
        }
        if (sigungu != null && !sigungu.isBlank()) {
            builder.and(s.regionSigungu.eq(sigungu));
        }
        if (search != null && !search.isBlank()) {
            builder.and(a.name.containsIgnoreCase(search)
                    .or(a.breed.containsIgnoreCase(search))
                    .or(s.name.containsIgnoreCase(search)));
        }

        return builder;
    }
}
