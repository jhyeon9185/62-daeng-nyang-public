import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AnimatedSection from '@/components/motion/AnimatedSection';
import AnimatedText from '@/components/motion/AnimatedText';
import { animalApi, favoriteApi } from '@/api';
import { useAuthStore } from '@/store/authStore';
import FavoriteButton from '@/components/animals/FavoriteButton';
import type { Animal } from '@/types/entities';

const speciesLabels: Record<string, string> = {
  DOG: '강아지',
  CAT: '고양이',
};

const sizeLabels: Record<string, string> = {
  SMALL: '소형',
  MEDIUM: '중형',
  LARGE: '대형',
};

export default function AdoptableSection() {
  const { isAuthenticated } = useAuthStore();
  const [adoptablePets, setAdoptablePets] = useState<Animal[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useEffect(() => {
    animalApi
      .getAll({
        page: 0,
        sizeParam: 20,
        sort: 'random',
      })
      .then((data) => {
        const content = (data?.content ?? []).filter(
          (a) => a.status === 'PROTECTED' || a.status === 'FOSTERING'
        );
        setAdoptablePets(content.slice(0, 8));
      })
      .catch(() => setAdoptablePets([]));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteIds([]);
      return;
    }
    favoriteApi.getMyFavoriteIds().then(setFavoriteIds).catch(() => setFavoriteIds([]));
  }, [isAuthenticated]);
  return (
    <section className="landing-section landing-magnet">
      <div className="landing-inner">
        <AnimatedSection>
          <h2 className="landing-section-title landing-section-title--center">
            <AnimatedText text="‘남겨진 62’를 줄이는 가장 빠른 방법" />
          </h2>
          <p className="landing-section-desc landing-section-desc--center">
            마음속 62%를 현실로 꺼내는 순간, 통계 속 한 아이가 가족을 만납니다.
          </p>
          <div className="landing-center-actions">
            <Link to="/animals" className="landing-btn landing-btn-primary">
              보호소 아이들 만나기
            </Link>
          </div>
          <div className="landing-pet-grid">
            {adoptablePets.map((animal) => (
              <Link key={animal.id} to={`/animals/${animal.id}`} className="landing-pet-card relative">
                <div className="absolute top-3 right-3 z-10">
                  <FavoriteButton
                    animalId={animal.id}
                    isFavorited={favoriteIds.includes(animal.id)}
                    onToggle={(added) => {
                      setFavoriteIds((prev) =>
                        added ? [...prev, animal.id] : prev.filter((id) => id !== animal.id)
                      );
                    }}
                    size="sm"
                  />
                </div>
                <div
                  className="landing-pet-card-img"
                  style={{
                    backgroundImage: animal.imageUrl ? `url(${animal.imageUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="landing-pet-card-body">
                  <p className="landing-pet-card-name">{animal.name}</p>
                  <p className="landing-pet-card-meta">
                    {speciesLabels[animal.species]} · {animal.age}세 · {sizeLabels[animal.size]}
                  </p>
                  <p className="landing-pet-card-story">
                    {animal.description || `${animal.breed} · ${animal.shelterName}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
