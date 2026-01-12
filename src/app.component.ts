
import { Component, signal, OnInit, OnDestroy, inject, PLATFORM_ID, ElementRef, Renderer2, AfterViewInit, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';

interface PricingTier {
  price: string;
  bonus: string;
  highlight?: boolean;
}

interface Recommendation {
  title: string;
  items: string[];
}

interface ProgramItem {
  title: string;
  desc: string;
  image: string;
  tags: string[];
  images?: string[];
  detailedDesc?: string;
  // New structured fields for clearer UI
  subDescription?: string[];
  pricing?: PricingTier[];
  pricingTitle?: string; // Added field for pricing section title
  recommendations?: Recommendation;
}

interface ReviewItem {
  name:string;
  date: string;
  content: string;
  rating: number;
  avatar: string;
  program?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface SliderDragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startTranslate: number;
  currentTranslate: number;
  lastX: number;
  lastTimestamp: number;
  velocityX: number;
  animationFrameId?: number;
  isScrolling?: boolean;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()',
    '(document:mouseup)': 'onGlobalEnd($event)',
    '(document:touchend)': 'onGlobalEnd($event)',
    '(document:mousemove)': 'onGlobalMove($event)',
    '(document:touchmove)': 'onGlobalMove($event)'
  },
  styles: [`
    :host {
      display: block;
      height: 100vh;
      height: 100dvh;
      width: 100%;
      overflow: hidden;
    }
    .font-cursive {
      font-family: 'Dancing Script', cursive;
    }
    .quote-icon {
      font-size: 4rem;
      line-height: 1;
      opacity: 0.1;
      font-family: serif;
    }
    @media (min-width: 768px) {
      .scroll-container {
        scroll-padding-top: 60px;
      }
    }
    
    .banner-image {
      opacity: 0;
      transform: scale(1.05);
      transition: opacity 1.5s ease-in-out, transform 0s linear 1.5s;
    }
    .banner-image.active {
      opacity: 1;
      transform: scale(1.15);
      transition: opacity 1.5s ease-in-out, transform 7s linear;
    }
    @keyframes line-expand {
      from { width: 0%; }
      to { width: 100%; }
    }
    .line-anim-container::before,
    .line-anim-container::after {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      height: 1px;
      background-color: rgba(255, 255, 255, 0.7);
      animation: line-expand 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      animation-delay: 1.4s;
    }
    .line-anim-container::before { top: -2px; }
    .line-anim-container::after { bottom: -2px; }

    @keyframes slide-up-fade-in {
      from { opacity: 0; transform: translateY(25px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .banner-anim-item {
      opacity: 0;
      animation: slide-up-fade-in 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    }
    .anim-delay-1 { animation-delay: 0.2s; }
    .anim-delay-2 { animation-delay: 0.4s; }
    .anim-delay-3 { animation-delay: 0.6s; }
    .anim-delay-4 { animation-delay: 0.8s; }

    @keyframes slide-right-fade-in {
      from { opacity: 0; transform: translateX(-25px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .aside-anim-item {
      opacity: 0;
      animation-duration: 0.7s;
      animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
      animation-fill-mode: forwards;
    }
    .anim-slide-from-left { animation-name: slide-right-fade-in; }
    .anim-slide-from-bottom { animation-name: slide-up-fade-in; }
    .aside-delay-1 { animation-delay: 0.2s; }
    .aside-delay-2 { animation-delay: 0.4s; }
    .aside-delay-3 { animation-delay: 0.6s; }
    .aside-delay-4 { animation-delay: 0.8s; }
    .aside-delay-5 { animation-delay: 1.0s; }
    .aside-delay-6 { animation-delay: 1.2s; }
    .aside-delay-7 { animation-delay: 1.4s; }
    .aside-delay-8 { animation-delay: 1.6s; }
    .aside-delay-9 { animation-delay: 1.8s; }
    
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in { animation: fade-in 0.3s ease-in-out; }

    @keyframes gradient-x {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .animated-gradient-bg { position: relative; z-index: 1; }
    .animated-gradient-bg::before {
      content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0;
      background: linear-gradient(to right, #ec4899, #ef4444, #f59e0b);
      background-size: 200% 200%;
      animation: gradient-x 5s ease infinite;
      transition: opacity 0.3s ease-in-out;
      z-index: -1;
      border-radius: 9999px;
    }
    
    @keyframes blink { 50% { opacity: 0; } }
    .typing-cursor {
      display: inline-block; width: 2px; height: 1em; background-color: currentColor;
      margin-left: 2px; animation: blink 1s infinite step-end;
      margin-bottom: 0; vertical-align: text-bottom;
    }

    /* Background Style - Custom Image */
    .wave-bg {
      background-image: url('https://raw.githubusercontent.com/artguy82/maisondeart/main/web/image2.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }

    /* Responsive Adjustments */
    @media (max-height: 850px) and (min-width: 1024px) {
      aside .text-5xl { font-size: 2.25rem; }
      aside .font-cursive.text-6xl { font-size: 3rem; }
      aside .text-7xl { font-size: 3.75rem; line-height: 1; }
      aside .text-lg { font-size: 1rem; line-height: 1.5rem; }
      aside.space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
      aside .py-4 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
      aside .py-3 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      aside .px-6 { padding-left: 1.25rem; padding-right: 1.25rem; }
    }
    
    /* Hide separator and description on very short screens */
    @media (max-height: 720px) and (min-width: 1024px) {
      aside > .aside-anim-item.aside-delay-2,
      aside > .aside-anim-item.aside-delay-3 {
        display: none;
      }
    }

    .slider-container { cursor: grab; user-select: none; touch-action: pan-y; }
    .slider-container.dragging { cursor: grabbing; }
    .slider-transition { transition: transform 500ms cubic-bezier(0.23, 1, 0.32, 1); }

    @keyframes popup-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popup-scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1;} }
    .popup-open { animation: popup-fade-in 0.3s ease-out forwards; }
    .popup-panel-open { animation: popup-scale-in 0.3s ease-out forwards; }
    .text-shadow-custom { text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6); }
  `]
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  isMenuOpen = signal(false);
  isMenuTextDark = signal(false);

  isPopupOpen = signal(false);
  popupContent = signal<'terms' | 'privacy' | null>(null);

  isProgramPopupOpen = signal(false);
  selectedProgram = signal<ProgramItem | null>(null);
  programImageIndex = signal(0);
  
  openFaqIndex = signal<number | null>(null);

  private platformId = inject(PLATFORM_ID);
  
  bannerImages: string[] = [
    'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/main.jpg',
    'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/main2.jpg',
    'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/main3.jpg',
    'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/main4.jpg',
    'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/main5.jpg'
  ];
  currentBannerIndex = signal(0);
  private bannerInterval: any;
  isInitialBannerAnimationTriggered = signal(false);

  rollingWords: string[] = [
    'Drawing', 'Forêt', 'Slow', 'Atelier', 'Sketch', 'Color', 'Nature', 'Story', 'Creative', 'Studio', 'Muse',
    'Healing', 'Calm', 'Peace', 'Comfort', 'Cozy', 'Light', 'Harmony', 'Green', 'Balance', 'Friend', 'Together', 'Link', 'Connection', 'Smile', 'Welcome'
  ];
  currentWordIndex = signal(0);
  displayedWord = signal('');
  
  private readonly TYPING_SPEED_MS = 120;
  private readonly DELETING_SPEED_MS = 70;
  private readonly PAUSE_AFTER_TYPING_MS = 2000;
  private animationTimeoutId: any;

  reviewIndex = signal(0);
  experienceIndex = signal(0);
  classIndex = signal(0);
  specialIndex = signal(0);

  // Dynamic Max Indices for Sliders
  maxIndices = signal<{ experience: number, class: number, special: number }>({
    experience: 0,
    class: 0,
    special: 0
  });

  private readonly CLONE_COUNT = 5;
  displayReviews = signal<ReviewItem[]>([]);
  private reviewAnimationId: number | null = null;
  private isReviewSliderPaused = signal(true);
  private reviewAutoScrollTimeout: any = null;
  private lastFrameTime: number = 0;
  private readonly SCROLL_SPEED = 40;

  displayReviewsLayer2 = signal<ReviewItem[]>([]);
  private reviewLayer2AnimationId: number | null = null;
  private isReviewSliderLayer2Paused = signal(true);
  private reviewAutoScrollTimeoutLayer2: any = null;
  private lastFrameTimeLayer2: number = 0;

  scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  parallaxBg = viewChild<ElementRef<HTMLElement>>('parallaxBg');
  reviewParallaxBg = viewChild<ElementRef<HTMLElement>>('reviewParallaxBg');
  groupFooterParallaxBg = viewChild<ElementRef<HTMLElement>>('groupFooterParallaxBg');
  experienceSlider = viewChild<ElementRef<HTMLElement>>('experienceSlider');
  classSlider = viewChild<ElementRef<HTMLElement>>('classSlider');
  specialSlider = viewChild<ElementRef<HTMLElement>>('specialSlider');
  reviewSlider = viewChild<ElementRef<HTMLElement>>('reviewSlider');
  reviewSliderLayer2 = viewChild<ElementRef<HTMLElement>>('reviewSliderLayer2');
  reviewsSection = viewChild<ElementRef<HTMLElement>>('reviewsSection');
  popupImageSliderContainer = viewChild<ElementRef<HTMLElement>>('popupImageSliderContainer');
  
  private renderer = inject(Renderer2);
  private readonly parallaxListener = () => this.updateParallax();
  
  private scrollSpyObserver?: IntersectionObserver;

  private sliderDragState: { [key: string]: SliderDragState } = {
    experience: { isDragging: false, startX: 0, startY: 0, startTranslate: 0, currentTranslate: 0, lastX: 0, lastTimestamp: 0, velocityX: 0, isScrolling: undefined },
    class: { isDragging: false, startX: 0, startY: 0, startTranslate: 0, currentTranslate: 0, lastX: 0, lastTimestamp: 0, velocityX: 0, isScrolling: undefined },
    special: { isDragging: false, startX: 0, startY: 0, startTranslate: 0, currentTranslate: 0, lastX: 0, lastTimestamp: 0, velocityX: 0, isScrolling: undefined },
    review: { isDragging: false, startX: 0, startY: 0, startTranslate: 0, currentTranslate: 0, lastX: 0, lastTimestamp: 0, velocityX: 0, isScrolling: undefined },
    reviewLayer2: { isDragging: false, startX: 0, startY: 0, startTranslate: 0, currentTranslate: 0, lastX: 0, lastTimestamp: 0, velocityX: 0, isScrolling: undefined },
  };
  
  private sliderTransitionTimers: { [key: string]: any } = {
    experience: null, class: null, special: null, review: null, reviewLayer2: null
  };
  
  private unlistenMouseUp!: () => void;
  private unlistenTouchEnd!: () => void;

  animatedReviewCount = signal('0');
  private reviewCountObserver?: IntersectionObserver;
  private countUpInitiated = false;
  private countUpAnimationId?: number;
  private countUpRestartTimeoutId?: any;

  popupImageDragState = {
    isDragging: false, startX: 0, startY: 0, currentTranslate: 0, startTranslate: 0, isScrolling: undefined as boolean | undefined
  };
  popupImageTranslateX = signal(0);
  popupImageSliderTransition = signal(true);

  experiences: ProgramItem[] = [
    { 
      title: '대형 도안 채색', 
      desc: '거대한 캔버스에 나만의 색을 입히는 몰입형 체험', 
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/pro2.jpg', 
      tags: ['집중력', '힐링', '초보자가능'], 
      images: [
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/big/1.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/big/2.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/big/3.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/big/4.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/big/5.jpg'
      ], 
      detailedDesc: `일상의 소음에서 벗어나 오롯이 나에게 집중하는 시간.
미리 준비된 대형 도안 위에 자신만의 색을 채워나가며, 복잡했던 마음을 정리하고 평온을 찾아보세요.
그림 실력에 관계없이 누구나 멋진 작품을 완성할 수 있으며, 그 과정 자체로 깊은 힐링과 성취감을 느낄 수 있습니다. 친구, 연인, 가족과 함께 혹은 혼자서도 즐기기 좋은 메종디아트의 대표 힐링 프로그램입니다.` 
    },
    { 
      title: '캔버스 아크릴 드로잉', 
      desc: '아크릴 물감의 질감을 느끼며 완성하는 나만의 작품', 
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/pro1.jpg', 
      tags: ['창의력', '자유주제'], 
      images: [
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/canvas/1.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/canvas/2.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/canvas/3.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/canvas/4.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/canvas/5.jpg'
      ], 
      detailedDesc: `하얀 캔버스 위, 당신의 상상력을 자유롭게 펼쳐보세요.
아크릴 물감의 꾸덕한 질감과 선명한 색감은 당신의 창의력에 날개를 달아줄 거예요.
사랑하는 반려동물, 잊지 못할 여행의 풍경, 혹은 마음속의 추상적인 이미지를 세상에 하나뿐인 작품으로 만들어보세요. 전문가의 코칭으로 처음이어도 괜찮아요.` 
    },
    { 
      title: '백드롭 페인팅', 
      desc: '질감 보조제를 활용한 트렌디한 추상화 그리기', 
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/pro3.jpg', 
      tags: ['인테리어', '감성'], 
      images: [
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/backdrop/1.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/backdrop/2.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/backdrop/3.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/backdrop/4.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/backdrop/5.jpg'
      ], 
      detailedDesc: `요즘 가장 트렌디한 인테리어 소품, 백드롭 페인팅을 직접 만들어보세요.
나이프와 질감 보조제를 이용해 캔버스 위에 거친 물결, 부드러운 구름 등 다양한 질감을 표현하고 원하는 색을 입혀 완성합니다.
정해진 규칙 없이 감각에 따라 완성하는 현대적인 예술 활동으로, 당신의 공간에 감각적인 포인트를 더해줄 것입니다.` 
    },
    { 
      title: '아트토이 베어브릭', 
      desc: '나만의 디자인으로 꾸미는 세상에 하나뿐인 베어브릭', 
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/pro5.jpg', 
      tags: ['키즈추천', '커플추천'], 
      images: [
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/arttoy/1.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/arttoy/2.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/arttoy/3.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/arttoy/4.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/arttoy/5.jpg'
      ], 
      detailedDesc: `세상에 단 하나뿐인 나만의 아트토이를 만들어 소장해보세요.
아트토이 전용 아크릴물감이 흰색 베이스를 채워 갈 수록 선명해 지는 나만의 캐릭터, 아이부터 어른까지 누구나 쉽고 재미있게 참여할 수 있습니다.
커플 아이템으로, 혹은 아이의 창의력을 키워주는 특별한 놀이로 강력 추천합니다. 완성된 베어브릭은 훌륭한 인테리어 소품이 됩니다.` 
    },
    { 
      title: '오일 파스텔', 
      desc: '부드러운 색감과 터치로 완성하는 따뜻한 그림', 
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/pro7.jpg', 
      tags: ['감성', '손그림'], 
      images: [
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/oilpastel/1.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/oilpastel/2.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/oilpastel/3.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/oilpastel/4.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/oilpastel/5.jpg'
      ], 
      detailedDesc: `크레파스처럼 부드럽게 그려지면서도 유화처럼 깊이감 있는 표현이 가능한 오일 파스텔의 매력에 빠져보세요.
손끝으로 색을 섞고 문지르며 만들어내는 따뜻하고 아날로그적인 감성은 디지털 드로잉이 줄 수 없는 특별한 위로를 선사합니다.
여행지에서의 풍경, 좋아하는 영화의 한 장면, 사랑스러운 디저트 등 그리고 싶은 어떤 것이든 캔버스에 담아보세요.` 
    }
  ];

  oneDayClasses: ProgramItem[] = [
    { 
      title: '액션! 추상 백드롭 페인팅', 
      desc: '에너지를 발산하며 만드는 역동적인 추상 예술', 
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/pro9.jpg', 
      tags: ['스트레스해소', '활동적'], 
      images: [
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/action/1.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/action/2.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/action/3.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/action/4.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/action/5.jpg'
      ], 
      detailedDesc: `머릿속 생각을 비우고 몸의 움직임에 집중하며 에너지를 발산하는 시간!
준비된 보조제와 물감을 이용해 긁어보고, 찍어보고, 튕겨보며 자유롭게 나를 표현해보세요.
미술 실력이나 기교는 중요하지 않습니다. 오직 당신의 감정과 에너지가 작품이 되는 역동적인 예술 활동으로, 쌓여있던 스트레스를 해소하고 내면의 활기를 되찾을 수 있습니다.` 
    },
    { 
      title: '발포세라믹 오브제 아트', 
      desc: '독특한 질감의 세라믹 오브제를 만드는 공예 시간', 
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/pro8.jpg', 
      tags: ['공예', '오브제'], 
      images: [
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/bubble/1.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/bubble/2.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/bubble/3.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/bubble/4.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/bubble/5.jpg'
      ], 
      detailedDesc: `가볍지만 돌처럼 단단한 신소재, 발포 세라믹으로 세상에 하나뿐인 나만의 오브제를 만들어보세요.
자연의 색과 도우분이 만나 형태가 굳어 갈때면 조형 예술가가 된 듯한 특별한 경험을 선사합니다.
독특한 질감과 형태로 당신의 공간을 더욱 특별하게 만들어 줄 감각적인 인테리어 소품을 직접 완성해보세요.` 
    },
    { 
      title: '아로마 캔들 아트', 
      desc: '향기와 아름다움을 동시에 담은 캔들 만들기', 
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/pro6.jpg', 
      tags: ['향기', '선물'], 
      images: [
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/candle/1.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/candle/2.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/candle/3.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/candle/4.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/candle/5.jpg'
      ], 
      detailedDesc: `다양한 아로마 오일 중 마음에 드는 향을 고르고, 아름다운 색과 장식을 더해 나만의 캔들을 디자인하는 시간입니다.
향초가 굳어가는 동안 따뜻한 차 한 잔과 함께 여유를 즐겨보세요.
내가 직접 만든 향기로운 캔들은 지친 하루 끝에 아늑한 위로를 선사할 것입니다. 소중한 사람을 위한 특별한 선물로도 더할 나위 없이 좋습니다.` 
    },
    { 
      title: '테라리움 힐링 아트', 
      desc: '작은 유리병 속에 나만의 정원을 꾸미는 시간', 
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/pro4.jpg', 
      tags: ['식물', '반려이끼'], 
      images: [
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/terrarium/1.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/terrarium/2.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/terrarium/3.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/terrarium/4.jpg',
        'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/terrarium/5.jpg'
      ], 
      detailedDesc: `유리병 속 작은 세상에 나만의 이야기를 담아보세요.
이끼와 작은 식물, 돌멩이를 조화롭게 배치하며 나만의 작은 정원을 가꾸는 과정은 마음을 차분하게 하고 자연과의 교감을 느끼게 합니다.
관리가 쉬워 식물을 처음 키워보는 분들에게도 좋으며, 책상 위 작은 반려 식물로 일상에 생기와 활력을 더해줄 것입니다.` 
    }
  ];

  specialPrograms: ProgramItem[] = [
    {
      title: '아트티콘(기프티콘)',
      desc: '더 많이, 더 알뜰하게 즐기는 메종디아트 아트 패스',
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/artticon.jpg',
      tags: ['모바일충전형', '추가포인트'],
      subDescription: [
        "구입 당일 바로 사용 가능",
        "모바일로 충전되 간편하게 사용",
        "충전포인트 모두 누구나 이용 가능",
        "금액대별 추가 포인트 적립",
        "방과후 창작 놀이터, 체험 프로그램 모두 사용 가능"
      ],
      pricingTitle: '힐링아트 기프티콘 3종!',
      pricing: [
        { price: '10만원권 구입시', bonus: '+5,000 P 추가 적립' },
        { price: '20만원권 구입시', bonus: '+15,000 P 추가 적립' },
        { price: '30만원권 구입시', bonus: '+25,000 P 추가 적립', highlight: true }
      ]
    },
    {
      title: '초등 방과후 창작 놀이터',
      desc: '초등학생 만을 위한 방과후 창작 아트 공간',
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/after.jpg',
      tags: ['집중력', '창의력'],
      subDescription: [
        "초등생 전용 1시간 체험권",
        "아트티콘(선불권) 구매 후 사용 가능",
        "기존 체험 대비 30% 할인",
        "방과후 시간 언제든 이용 가능",
        "시간연장시 50% 추가 할인 적용"
      ],
      recommendations: {
        title: "이런 아이에게 추천해요!",
        items: [
          "미술을 좋아하지만 학원식 수업은 부담스러운 아이",
          "자유롭게 그리고 만들며 놀고 싶은 아이",
          "방과후 창의력을 키우고 싶은 아이"
        ]
      }
    },
    {
      title: '취미 드로잉 프로젝트',
      desc: '완성까지 회차 제한 없이 여유롭게 이어가는 장기 프로젝트',
      image: 'https://raw.githubusercontent.com/artguy82/maisondeart/main/web/hobby.jpg',
      tags: ['특대형', '성인취미'],
      subDescription: [
        "30호 특대형 캔버스 아크릴 드로잉",
        "대형 프린트로 스케치 쉽게 가능",
        "회차 제한 없이 작품이 완성될 때까지 자유롭게 이용",
        "(옵션)티칭 & 터칭 : 맞춤 이론 및 보정 지도",
        "(옵션)대리 작품 제작 (기간 협의) : 별도 상담"
      ],
      recommendations: {
        title: "이런 분께 추천해요!",
        items: [
          "진짜 “작품” 하나를 집에 걸고 싶은 분",
          "취미로 시작했지만, 제대로 된 결과물을 만들고 싶은 분",
          "완성 보다는 그 과정에 심취하며 힐링 하고 싶은 분"
        ]
      }
    }
  ];

  reviews: ReviewItem[] = [
    { name: '김** 님', date: '5일 전', content: '남자친구랑 커플 베어브릭 만들었는데 너무 재밌었어요! 세상에 하나뿐인 저희만의 아트토이가 생겨서 너무 뿌듯하고, 만드는 내내 시간 가는 줄 몰랐네요. 사장님도 친절하게 잘 알려주셔서 좋았습니다!', rating: 5, avatar: 'https://picsum.photos/seed/avatar1/40/40', program: '아트토이 베어브릭' },
    { name: '박** 맘', date: '3일 전', content: '아이가 너무 좋아했어요! 그림 그리는걸 좋아해서 데려왔는데, 큰 도안에 마음껏 색칠하는 걸 보니 저까지 힐링되는 기분이었어요. 다음에 또 방문할게요!', rating: 5, avatar: 'https://picsum.photos/seed/avatar2/40/40', program: '대형 도안 채색' },
    { name: '최** 님', date: '1주 전', content: '백드롭 페인팅 처음 도전해봤는데 진짜 스트레스 확 풀려요! 질감을 만들고 색을 올리는 과정이 너무 매력적이더라구요. 완성된 작품은 저희 집 거실에 멋지게 걸어뒀답니다.', rating: 5, avatar: 'https://picsum.photos/seed/avatar3/40/40', program: '백드롭 페인팅' },
    { name: '이** 님', date: '2주 전', content: '기념일 데이트로 방문했는데 탁월한 선택이었어요. 조용한 분위기에서 서로에게 집중하며 그림을 그리니 더 애틋해지는 느낌? 오일 파스텔 색감이 너무 예뻐서 결과물도 대만족입니다.', rating: 5, avatar: 'https://picsum.photos/seed/avatar4/40/40', program: '오일 파스텔' },
    { name: '정** 님', date: '1달 전', content: '음료도 맛있고, 카페 분위기가 정말 좋아요. 그림 그리지 않고 그냥 커피만 마시러 와도 좋을 것 같아요. 창 밖 풍경 보면서 멍 때리기 최고!', rating: 5, avatar: 'https://picsum.photos/seed/avatar5/40/40' },
    { name: '강** 님', date: '어제', content: '똥손이라 걱정했는데, 사장님이 친절하게 알려주셔서 저도 인생 작품을 만들었어요! 캔버스에 아크릴 물감으로 그리는 거 정말 매력있네요. 자신감이 생겼어요!', rating: 5, avatar: 'https://picsum.photos/seed/avatar6/40/40', program: '캔버스 아크릴 드로잉' },
    { name: '조** 님', date: '6일 전', content: '친구들이랑 단체로 방문했는데 다들 시간 가는 줄 모르고 즐겼어요. 각자 개성이 드러나는 작품이 나와서 비교해보는 재미도 있었구요. 다음에 또 뭉치기로 했습니다!', rating: 5, avatar: 'https://picsum.photos/seed/avatar7/40/40' },
    { name: '윤** 님', date: '4일 전', content: '혼자만의 시간이 필요해서 찾았는데, 그림에 집중하다 보니 복잡했던 머릿속이 정리되는 기분이었어요. 진정한 힐링을 경험하고 갑니다.', rating: 5, avatar: 'https://picsum.photos/seed/avatar8/40/40', program: '캔버스 아크릴 드로잉' },
    { name: '임** 님', date: '3주 전', content: '오일파스텔 색감이 너무 예뻐서 마음에 쏙 들어요. 완성작은 제 방에 예쁘게 걸어뒀어요. 볼 때마다 뿌듯해요!', rating: 5, avatar: 'https://picsum.photos/seed/avatar9/40/40', program: '오일 파스텔' },
    { name: '한** 님', date: '1달 전', content: '회사 동료들이랑 워크샵으로 왔는데, 다들 너무 좋아했어요. 맨날 컴퓨터만 보다가 알록달록한 물감을 보니 눈이 정화되는 느낌! 팀워크도 더 좋아진 것 같아요.', rating: 5, avatar: 'https://picsum.photos/seed/avatar10/40/40', program: '단체 체험' },
    { name: '오** 님', date: '2일 전', content: '인테리어가 감성적이라 사진 찍기에도 너무 좋아요. 작품이랑 같이 인생샷 많이 건졌습니다. 완전 추천!', rating: 5, avatar: 'https://picsum.photos/seed/avatar11/40/40' },
    { name: '신** 님', date: '1주 전', content: '도안 종류가 많아서 고르는 재미가 있었어요. 다음엔 더 어려운 도안에 도전해보고 싶네요! 사장님 실력도 좋으셔서 많이 배웠습니다.', rating: 5, avatar: 'https://picsum.photos/seed/avatar12/40/40', program: '대형 도안 채색' },
    { name: '권** 님', date: '3주 전', content: '부모님 모시고 갔는데, 소녀처럼 좋아하시는 모습 보니 저도 기뻤어요. 세대 불문하고 모두가 즐길 수 있는 최고의 장소인 것 같아요. 부모님께 특별한 추억을 선물해드렸네요.', rating: 5, avatar: 'https://picsum.photos/seed/avatar13/40/40' },
    { name: '안** 님', date: '1달 전', content: '아이가 만든 베어브릭, 집에 오자마자 제일 잘 보이는 곳에 장식했어요. 자기 작품이라며 애지중지하는 모습이 너무 귀엽네요. 아이들 창의력 키우기에도 좋은 것 같아요.', rating: 5, avatar: 'https://picsum.photos/seed/avatar14/40/40', program: '아트토이 베어브릭' },
    { name: '송** 님', date: '2달 전', content: '깨끗하고 재료 관리도 잘 되어 있어서 쾌적하게 이용했습니다. 모든 게 만족스러웠던 곳이에요. 재방문 의사 200%입니다.', rating: 5, avatar: 'https://picsum.photos/seed/avatar15/40/40' },
    { name: '유** 님', date: '1주 전', content: '완성한 작품을 예쁘게 포장해주셔서 좋았어요. 선물 받는 느낌! 세심한 배려에 감동했습니다. 친구에게 바로 선물했는데 정말 좋아했어요.', rating: 5, avatar: 'https://picsum.photos/seed/avatar16/40/40' },
    { name: '문** 님', date: '3주 전', content: '생각보다 시간이 훌쩍 가서 놀랐어요. 그만큼 몰입도가 엄청난 체험입니다. 잡생각 없애는 데 최고예요!', rating: 5, avatar: 'https://picsum.photos/seed/avatar17/40/40' },
    { name: '백** 님', date: '2달 전', content: '네이버로 미리 예약하고 갔더니 바로 안내받아서 편했어요. 시스템이 잘 되어 있는 것 같아요. 기다리지 않아서 좋았습니다.', rating: 5, avatar: 'https://picsum.photos/seed/avatar18/40/40' },
    { name: '전** 님', date: '1달 전', content: '다른 드로잉 카페보다 공간이 넓어서 답답하지 않고 좋았어요. 옆 사람이랑 부딪힐 일도 없었구요. 쾌적한 환경에서 그림에만 집중할 수 있었어요.', rating: 5, avatar: 'https://picsum.photos/seed/avatar19/40/40' },
    { name: '하** 님', date: '3일 전', content: '부산 여행 중 특별한 경험을 하고 싶어서 예약했는데, 최고의 선택이었습니다. 여행의 하이라이트였어요! 부산 바다 보는 것만큼이나 힐링되는 시간이었어요.', rating: 5, avatar: 'https://picsum.photos/seed/avatar20/40/40', program: '캔버스 아크릴 드로잉' },
  ];
  
  reviewsLayer2: ReviewItem[] = [
    { name: '김*진 님', date: '어제', content: '테라리움 만들러 왔는데, 작은 식물들로 저만의 세상을 만드는게 너무 좋았어요. 시간 가는 줄 몰랐네요. 책상 위에 두고 매일 보려구요!', rating: 5, avatar: 'https://picsum.photos/seed/reviewA/40/40', program: '테라리움 힐링 아트' },
    { name: '이*솔 님', date: '2일 전', content: '남자친구랑 액션 페인팅 했는데, 그냥 물감 뿌리는건데도 엄청 재밌고 스트레스 풀렸어요! 서로 옷에 묻히면서 웃고 떠들다보니 작품이 완성됐네요. 이색 데이트로 강추!', rating: 5, avatar: 'https://picsum.photos/seed/reviewB/40/40', program: '액션! 추상 백드롭 페인팅' },
    { name: '박*현 님', date: '1주 전', content: '결혼기념일 선물로 아내가 좋아하는 아로마 캔들 만들었어요. 향도 직접 고를 수 있고, 모양도 예뻐서 아내가 정말 좋아하네요. 특별한 선물이 된 것 같아 뿌듯합니다.', rating: 5, avatar: 'https://picsum.photos/seed/reviewC/40/40', program: '아로마 캔들 아트' },
    { name: '서*아 님', date: '3일 전', content: '비오는 날이었는데 창밖 보면서 그림 그리니 운치있고 좋았어요. 카페도 쾌적하고 조용해서 집중이 잘 됐습니다. 다음에 또 혼자 힐링하러 올거에요.', rating: 5, avatar: 'https://picsum.photos/seed/reviewD/40/40' },
    { name: '황*정 님', date: '5일 전', content: '아이 손 잡고 처음 와봤는데, 직원분들이 아이 눈높이에 맞춰서 친절하게 설명해주셔서 감사했어요. 아이가 집에 안가려고 해서 혼났네요. 조만간 또 와야겠어요.', rating: 5, avatar: 'https://picsum.photos/seed/reviewE/40/40', program: '대형 도안 채색' },
    { name: '고*연 님', date: '2주 전', content: '오랜만에 붓 잡으니 학창시절 생각도 나고 좋았어요. 그림 실력은 없지만, 예쁜 도안이 많아서 저같은 초보도 쉽게 완성할 수 있었습니다. 자신감 얻고 가요!', rating: 5, avatar: 'https://picsum.photos/seed/reviewF/40/40', program: '캔버스 아크릴 드로잉' },
    { name: '배*민 님', date: '6일 전', content: '베어브릭 커스텀 처음 해봤는데 꿀잼! 나만의 아트토이가 생겨서 너무 좋아요. 친구들한테 자랑했더니 다들 어디냐고 물어보네요.', rating: 5, avatar: 'https://picsum.photos/seed/reviewG/40/40', program: '아트토이 베어브릭' },
    { name: '장*희 님', date: '1달 전', content: '뷰가 정말 멋져요. 그림 그리다가 고개들면 보이는 풍경에 마음이 편안해집니다. 커피 맛도 좋아서 친구랑 수다 떨기에도 최고의 장소!', rating: 5, avatar: 'https://picsum.photos/seed/reviewH/40/40' },
    { name: '나*영 님', date: '3주 전', content: '발포세라믹 질감이 너무 신기하고 재밌었어요. 세상에 하나뿐인 나만의 오브제가 생겼네요. 집안 분위기가 확 살아요!', rating: 5, avatar: 'https://picsum.photos/seed/reviewI/40/40', program: '발포세라믹 오브제 아트' },
    { name: '류*나 님', date: '1주 전', content: '오일 파스텔의 매력에 푹 빠졌어요. 슥슥 그리는 느낌도 좋고 색감도 따뜻해서 힐링 그 자체였습니다. 재료 사서 집에서도 그려보려구요!', rating: 5, avatar: 'https://picsum.photos/seed/reviewJ/40/40', program: '오일 파스텔' },
    { name: '정*훈 님', date: '2일 전', content: '여자친구가 가자고 해서 끌려왔는데 제가 더 재밌게 했네요. 집중해서 뭔가 만드니 잡생각도 없어지고 좋았습니다. 다음에 또 오자고 제가 먼저 얘기했어요.', rating: 5, avatar: 'https://picsum.photos/seed/reviewK/40/40' },
    { name: '차*우 님', date: '10일 전', content: '친구 생일선물로 같이 와서 체험했어요. 그림 선물도 의미있고, 함께 시간 보내는 것도 즐거웠습니다. 친구가 너무 감동받았어요!', rating: 5, avatar: 'https://picsum.photos/seed/reviewL/40/40' },
    { name: '남*지 님', date: '4일 전', content: '인스타그램 보고 방문했는데 사진보다 실제 공간이 더 예뻐요! 곳곳이 포토존이라 사진 찍기 바빴네요. 그림도 그리고 인생샷도 건지고 일석이조!', rating: 5, avatar: 'https://picsum.photos/seed/reviewM/40/40' },
    { name: '심*경 님', date: '2주 전', content: '주차장이 있어서 편하게 방문했어요. 주차 걱정 없는게 제일 좋네요. 시설도 깨끗하고 모든게 만족스러웠습니다.', rating: 5, avatar: 'https://picsum.photos/seed/reviewN/40/40' },
    { name: '도*원 님', date: '3달 전', content: '매번 똑같은 데이트가 지겨웠는데, 드로잉 카페는 정말 신선했어요. 서로 그림 그려주기도 하고, 같이 작품 만들면서 더 가까워진 기분이에요.', rating: 5, avatar: 'https://picsum.photos/seed/reviewO/40/40', program: '캔버스 아크릴 드로잉' },
    { name: '마*선 님', date: '1달 전', content: '음료랑 디저트도 생각보다 퀄리티가 좋아서 놀랐어요. 그림 그리다 당 떨어질 때쯤 먹으니 꿀맛! 다음엔 디저트 먹으러 와야겠어요.', rating: 5, avatar: 'https://picsum.photos/seed/reviewP/40/40' },
    { name: '편*윤 님', date: '3주 전', content: '백드롭 페인팅으로 스트레스 제대로 풀고 갑니다! 아무 생각 없이 물감을 짜고 펴바르니 속이 다 시원해지는 느낌이에요. 현대인 필수 코스인듯.', rating: 5, avatar: 'https://picsum.photos/seed/reviewQ/40/40', program: '백드롭 페인팅' },
    { name: '우*민 님', date: '5일 전', content: '선생님이 중간중간 오셔서 어려운 부분 도와주시고 팁도 알려주셔서 좋았어요. 막막할 때마다 나타나셔서 해결해주시는 느낌! 덕분에 예쁜 작품 완성했어요.', rating: 5, avatar: 'https://picsum.photos/seed/reviewR/40/40' },
    { name: '채*아 님', date: '1주 전', content: '아이랑 같이 베어브릭 만들었는데, 아이가 너무 좋아해서 뿌듯했어요. 소근육 발달에도 좋을 것 같고, 아이 상상력을 자극하는 좋은 시간이었어요.', rating: 5, avatar: 'https://picsum.photos/seed/reviewS/40/40', program: '아트토이 베어브릭' },
    { name: '엄*준 님', date: '3달 전', content: '부산 여행 마지막 코스로 들렀는데, 여행의 피로가 싹 풀리는 느낌이었어요. 부산에서의 특별한 추억을 작품으로 남길 수 있어서 더 의미있었습니다.', rating: 5, avatar: 'https://picsum.photos/seed/reviewT/40/40' }
  ];

  faqs: FaqItem[] = [
    { question: '예약은 꼭 해야 하나요?', answer: '네, 원활한 체험 진행을 위해 네이버 예약제를 운영하고 있습니다. 당일 예약은 체험 1시간 전까지 가능합니다.' },
    { question: '그림을 못 그려도 괜찮나요?', answer: '물론입니다! 메종디아트의 도안과 가이드가 있어 초보자도 멋진 작품을 완성할 수 있습니다. 전문가의 코칭도 도와드립니다.' },
    { question: '소요 시간은 얼마나 걸리나요?', answer: '프로그램마다 다르지만 보통 1시간 30분에서 2시간 정도 소요됩니다. 개인차에 따라 조금씩 달라질 수 있습니다.' },
    { question: '주차는 가능한가요?', answer: '네, 건물 내 주차타워를 무료로 이용하실 수 있습니다. 대형 SUV 차량의 경우 별도 문의 부탁드립니다.' },
    { question: '단체 예약도 가능한가요?', answer: '네, 기업 워크샵, 동호회 등 단체 체험 및 대관이 가능합니다. 전화로 문의 주시면 자세한 상담 도와드리겠습니다.' }
  ];

  private readonly resizeListener = () => {
    this.calculateMaxIndices();
    this.updateSliderPosition('experience', false);
    this.updateSliderPosition('class', false);
    this.updateSliderPosition('special', false);
    this.updateSliderPosition('review', false);
    this.updateSliderPosition('reviewLayer2', false);
  };

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.resizeListener);
    }
    
    // Fill dummy data for demonstration if arrays are small
    while(this.reviews.length < 10) this.reviews = [...this.reviews, ...this.reviews];
    while(this.reviewsLayer2.length < 10) this.reviewsLayer2 = [...this.reviewsLayer2, ...this.reviewsLayer2];

    this.setupInfiniteReviewSlider();
    this.setupInfiniteReviewSliderLayer2();
    
    this.currentWordIndex.set(Math.floor(Math.random() * this.rollingWords.length));

    this.bannerInterval = setInterval(() => {
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * this.bannerImages.length);
        } while (nextIndex === this.currentBannerIndex());
        this.currentBannerIndex.set(nextIndex);
    }, 7000);

    this.startTypingAnimationLoop();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const scrollEl = this.scrollContainer();
      if (scrollEl) {
        scrollEl.nativeElement.addEventListener('scroll', this.parallaxListener, { passive: true });
        
        // Initialize ScrollSpy
        this.setupScrollSpy();
      }

      this.unlistenMouseUp = this.renderer.listen('window', 'mouseup', () => this.handleDragEnd());
      this.unlistenTouchEnd = this.renderer.listen('window', 'touchend', () => this.handleDragEnd());

      // Initial layout setup
      setTimeout(() => {
        this.calculateMaxIndices();
        this.updateSliderPosition('experience');
        this.updateSliderPosition('class');
        this.updateSliderPosition('special');
        this.updateSliderPosition('review', false);
        this.updateSliderPosition('reviewLayer2', false);
        this.resumeReviewAutoScroll(2000);
        this.resumeReviewAutoScrollLayer2(2000);
        this.setupReviewCountObserver();
        
        // Initial Banner Animation
        if (this.bannerImages.length > 0) {
          this.isInitialBannerAnimationTriggered.set(true);
        }
      }, 100);
    }
  }

  onGlobalMove(event: MouseEvent | TouchEvent) {
    if (this.sliderDragState.experience.isDragging) this.dragging(event, 'experience');
    else if (this.sliderDragState.class.isDragging) this.dragging(event, 'class');
    else if (this.sliderDragState.special.isDragging) this.dragging(event, 'special');
    else if (this.sliderDragState.review.isDragging) this.dragging(event, 'review');
    else if (this.sliderDragState.reviewLayer2.isDragging) this.dragging(event, 'reviewLayer2');
    
    if (this.popupImageDragState.isDragging) this.popupImageDragging(event);
  }

  onGlobalEnd(event: MouseEvent | TouchEvent) {
    this.handleDragEnd();
  }

  onResize() {
    this.calculateMaxIndices();
    this.updateSliderPosition('experience', false);
    this.updateSliderPosition('class', false);
    this.updateSliderPosition('special', false);
    this.updateSliderPosition('review', false);
    this.updateSliderPosition('reviewLayer2', false);
  }

  private handleDragEnd(): void {
    if (this.sliderDragState.experience.isDragging) this.dragEnd('experience');
    if (this.sliderDragState.class.isDragging) this.dragEnd('class');
    if (this.sliderDragState.special.isDragging) this.dragEnd('special');
    if (this.sliderDragState.review.isDragging) this.dragEnd('review');
    if (this.sliderDragState.reviewLayer2.isDragging) this.dragEnd('reviewLayer2');
    if (this.popupImageDragState.isDragging) this.popupImageDragEnd();
  }

  // --- Scroll Spy for Menu Color ---
  private setupScrollSpy() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // We observe the main sections. When one enters the "top area", we check its background brightness.
    const scrollContainerEl = this.scrollContainer()?.nativeElement;
    if (!scrollContainerEl) return;

    const options = {
      root: scrollContainerEl,
      // '0px 0px -90% 0px' means: Check intersection with the top 10% of the viewport.
      rootMargin: '0px 0px -90% 0px', 
      threshold: 0
    };

    this.scrollSpyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          // Sections that have a LIGHT background (so we need DARK text)
          const lightSections = ['intro', 'programs', 'reviews', 'group', 'faq'];
          // 'home', 'healing-art', 'quote-divider', 'contact' are DARK background (need WHITE text)
          
          this.isMenuTextDark.set(lightSections.includes(id));
        }
      });
    }, options);

    const sections = ['home', 'intro', 'healing-art', 'programs', 'reviews', 'group', 'faq', 'quote-divider', 'contact'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) this.scrollSpyObserver?.observe(el);
    });
  }

  // Helper to replace DOMMatrix for safer translateX extraction
  private getTranslateX(element: HTMLElement): number {
    if (!isPlatformBrowser(this.platformId)) return 0;
    const style = window.getComputedStyle(element);
    const transform = style.transform;
    if (transform === 'none' || !transform) return 0;

    // matrix(a, b, c, d, tx, ty)
    const mat = transform.match(/^matrix\((.+)\)$/);
    if (mat) {
        const parts = mat[1].split(',').map(parseFloat);
        return parts[4] || 0; 
    }
    // matrix3d support if needed, though usually 2d for simple slides
    const mat3d = transform.match(/^matrix3d\((.+)\)$/);
    if (mat3d) {
        const parts = mat3d[1].split(',').map(parseFloat);
        return parts[12] || 0;
    }
    return 0;
  }

  // ... (Other standard methods remain similar but using getTranslateX)

  private setupInfiniteReviewSlider(): void {
    if (!isPlatformBrowser(this.platformId) || this.reviews.length === 0) {
        this.displayReviews.set(this.reviews);
        return;
    }
    const cloneCount = Math.min(this.reviews.length, this.CLONE_COUNT);
    const clonesStart = this.reviews.slice(-cloneCount);
    const clonesEnd = this.reviews.slice(0, cloneCount);
    this.displayReviews.set([...clonesStart, ...this.reviews, ...clonesEnd]);
    this.reviewIndex.set(cloneCount);
  }

  private setupInfiniteReviewSliderLayer2(): void {
    if (!isPlatformBrowser(this.platformId) || this.reviewsLayer2.length === 0) {
        this.displayReviewsLayer2.set(this.reviewsLayer2);
        return;
    }
    const cloneCount = Math.min(this.reviewsLayer2.length, this.CLONE_COUNT);
    const clonesStart = this.reviewsLayer2.slice(-cloneCount);
    const clonesEnd = this.reviewsLayer2.slice(0, cloneCount);
    this.displayReviewsLayer2.set([...clonesStart, ...this.reviewsLayer2, ...clonesEnd]);
  }

  private setupReviewCountObserver() {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = document.getElementById('review-count-stat');
    if (target) {
      this.reviewCountObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.countUpInitiated) {
            this.countUpInitiated = true;
            this.animateCountUp(0, 1220, 2000);
            this.reviewCountObserver?.disconnect();
          }
        });
      }, { threshold: 0.1 });
      this.reviewCountObserver.observe(target);
    }
  }

  private animateCountUp(start: number, end: number, duration: number) {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); 
      const current = Math.floor(ease * (end - start) + start);
      this.animatedReviewCount.set(current.toLocaleString());
      if (progress < 1) {
        this.countUpAnimationId = requestAnimationFrame(step);
      } else {
        this.countUpRestartTimeoutId = setTimeout(() => {
          this.animateCountUp(start, end, duration);
        }, 3000);
      }
    };
    this.countUpAnimationId = requestAnimationFrame(step);
  }

  private updateParallax() {
    const applyEffect = (el: HTMLElement | undefined, speed: number) => {
        const scrollEl = this.scrollContainer();
        if (!el || !scrollEl) return;
        const container = scrollEl.nativeElement;
        const section = el.closest('section') as HTMLElement;
        if (!section) return;

        const scrollTop = container.scrollTop;
        const sectionTop = section.offsetTop;
        const containerHeight = container.offsetHeight;
        
        const sectionTopRelativeToVisible = sectionTop - scrollTop;
        if (sectionTopRelativeToVisible < containerHeight && sectionTopRelativeToVisible > -section.offsetHeight) {
            const translateY = sectionTopRelativeToVisible * speed;
            this.renderer.setStyle(el, 'transform', `translate3d(0, ${translateY}px, 0)`);
        }
    };

    if (isPlatformBrowser(this.platformId)) {
        applyEffect(this.parallaxBg()?.nativeElement, -0.2);
        applyEffect(this.reviewParallaxBg()?.nativeElement, -0.1);
        applyEffect(this.groupFooterParallaxBg()?.nativeElement, -0.05);
    }
  }

  private startTypingAnimationLoop() {
    const wordToType = this.rollingWords[this.currentWordIndex()];
    this.typeWord(wordToType, () => {
      this.animationTimeoutId = setTimeout(() => {
        this.deleteWord(() => {
          this.currentWordIndex.update(prevIndex => {
            let nextIndex;
            do { nextIndex = Math.floor(Math.random() * this.rollingWords.length); } while (nextIndex === prevIndex);
            return nextIndex;
          });
          this.startTypingAnimationLoop();
        });
      }, this.PAUSE_AFTER_TYPING_MS);
    });
  }

  private typeWord(word: string, onComplete: () => void) {
    let i = 0;
    const typeChar = () => {
      if (i < word.length) {
        this.displayedWord.update(current => current + word[i]);
        i++;
        this.animationTimeoutId = setTimeout(typeChar, this.TYPING_SPEED_MS);
      } else {
        onComplete();
      }
    };
    typeChar();
  }

  private deleteWord(onComplete: () => void) {
    const deleteChar = () => {
      if (this.displayedWord().length > 0) {
        this.displayedWord.update(current => current.slice(0, -1));
        this.animationTimeoutId = setTimeout(deleteChar, this.DELETING_SPEED_MS);
      } else {
        onComplete();
      }
    };
    deleteChar();
  }

  toggleMenu() { this.isMenuOpen.update(v => !v); }
  closeMenu() { this.isMenuOpen.set(false); }

  scrollToSection(sectionId: string) {
    this.closeMenu();
    if (!isPlatformBrowser(this.platformId)) return;
    const element = document.getElementById(sectionId);
    const scrollContainerEl = this.scrollContainer()?.nativeElement;
    if (element && scrollContainerEl) {
      const isDesktop = window.innerWidth >= 768;
      let offset = 0;
      
      // 모바일 헤더 높이 60px (64px에서 복구) -> 0px로 수정
      if (!isDesktop && sectionId !== 'home') {
        offset = 0;
      }
      
      // 데스크탑 네비게이션 높이: 48px -> 46px로 수정
      if (isDesktop && !['home', 'intro', 'healing-art', 'quote-divider'].includes(sectionId)) {
          offset = 46; 
      }
      
      const rect = element.getBoundingClientRect();
      const scrollContainerRect = scrollContainerEl.getBoundingClientRect();
      const topPosition = rect.top - scrollContainerRect.top + scrollContainerEl.scrollTop - offset;
      scrollContainerEl.scrollTo({ top: topPosition, behavior: 'smooth' });
    }
  }

  callShop() { window.location.href = 'tel:0507-1381-5672'; }

  openPopup(type: 'terms' | 'privacy') { this.popupContent.set(type); this.isPopupOpen.set(true); }
  closePopup() { this.isPopupOpen.set(false); }

  openProgramPopup(program: ProgramItem) {
    this.selectedProgram.set(program);
    this.programImageIndex.set(0);
    this.isProgramPopupOpen.set(true);
    this.popupImageTranslateX.set(0);
    this.popupImageSliderTransition.set(true);
  }

  closeProgramPopup() {
    this.isProgramPopupOpen.set(false);
    setTimeout(() => { this.selectedProgram.set(null); }, 300);
  }

  nextProgramImage() {
    const images = this.selectedProgram()?.images;
    if (images && images.length > 1) {
      const newIndex = this.programImageIndex() + 1;
      if (newIndex < images.length) this.programImageIndex.set(newIndex);
    }
    this.updatePopupSliderPosition();
  }

  prevProgramImage() {
    if (this.programImageIndex() > 0) this.programImageIndex.update(i => i - 1);
    this.updatePopupSliderPosition();
  }
  
  setProgramImage(index: number) {
    this.programImageIndex.set(index);
    this.updatePopupSliderPosition();
  }

  updatePopupSliderPosition() {
    const sliderEl = this.popupImageSliderContainer();
    if (sliderEl) {
        const containerWidth = sliderEl.nativeElement.offsetWidth;
        const newTranslate = -this.programImageIndex() * containerWidth;
        this.popupImageSliderTransition.set(true);
        this.popupImageTranslateX.set(newTranslate);
    }
  }

  popupImageDragStart(event: MouseEvent | TouchEvent) {
    const sliderEl = this.popupImageSliderContainer()?.nativeElement;
    if (!sliderEl) return;
    this.popupImageDragState.isDragging = true;
    this.popupImageDragState.startX = this.getPositionX(event);
    this.popupImageDragState.startY = this.getPositionY(event);
    this.popupImageDragState.startTranslate = this.popupImageTranslateX();
    this.popupImageDragState.isScrolling = undefined;
    this.popupImageSliderTransition.set(false);
  }

  popupImageDragging(event: MouseEvent | TouchEvent) {
    if (!this.popupImageDragState.isDragging) return;
    const currentX = this.getPositionX(event);
    const currentY = this.getPositionY(event);
    if (this.popupImageDragState.isScrolling === undefined) {
        const dx = Math.abs(currentX - this.popupImageDragState.startX);
        const dy = Math.abs(currentY - this.popupImageDragState.startY);
        if (dx > 5 || dy > 5) {
            if (dy > dx) {
                this.popupImageDragState.isScrolling = true;
                this.popupImageDragState.isDragging = false;
                return;
            } else {
                this.popupImageDragState.isScrolling = false;
            }
        }
    }
    if (this.popupImageDragState.isScrolling) return;
    if (event.cancelable) event.preventDefault();
    const diff = currentX - this.popupImageDragState.startX;
    this.popupImageTranslateX.set(this.popupImageDragState.startTranslate + diff);
  }

  popupImageDragEnd() {
    if (!this.popupImageDragState.isDragging) return;
    this.popupImageDragState.isDragging = false;
    const sliderEl = this.popupImageSliderContainer()?.nativeElement;
    if (!sliderEl) return;
    const containerWidth = sliderEl.offsetWidth;
    const images = this.selectedProgram()?.images;
    if (!images || images.length === 0) return;
    const currentTranslate = this.popupImageTranslateX();
    let newIndex = Math.round(-currentTranslate / containerWidth);
    newIndex = Math.max(0, Math.min(newIndex, images.length - 1));
    this.programImageIndex.set(newIndex);
    this.updatePopupSliderPosition();
  }

  nextExperience() { this.setIndex('experience', this.experienceIndex() + 1); }
  prevExperience() { this.setIndex('experience', this.experienceIndex() - 1); }
  nextClass() { this.setIndex('class', this.classIndex() + 1); }
  prevClass() { this.setIndex('class', this.classIndex() - 1); }
  nextSpecial() { this.setIndex('special', this.specialIndex() + 1); }
  prevSpecial() { this.setIndex('special', this.specialIndex() - 1); }
  
  toggleFaq(index: number) {
    this.openFaqIndex.update(currentIndex => (currentIndex === index ? null : index));
  }
  
  private getSliderElement(type: string): HTMLElement | undefined {
    if (type === 'experience') return this.experienceSlider()?.nativeElement;
    if (type === 'class') return this.classSlider()?.nativeElement;
    if (type === 'special') return this.specialSlider()?.nativeElement;
    if (type === 'review') return this.reviewSlider()?.nativeElement;
    if (type === 'reviewLayer2') return this.reviewSliderLayer2()?.nativeElement;
    return undefined;
  }
  
  private getSlideWidth(type: string): number {
    if (!isPlatformBrowser(this.platformId)) return 500;
    const sliderEl = this.getSliderElement(type);
    if (!sliderEl?.firstElementChild) return 0;
    const firstRect = sliderEl.firstElementChild.getBoundingClientRect();
    if (sliderEl.children.length > 1) {
        const secondRect = sliderEl.children[1].getBoundingClientRect();
        return Math.abs(secondRect.left - firstRect.left);
    }
    return firstRect.width;
  }
  
  private getIndex(type: string): number {
    if (type === 'experience') return this.experienceIndex();
    if (type === 'class') return this.classIndex();
    if (type === 'special') return this.specialIndex();
    return 0; 
  }

  public getMaxIndex(type: string): number {
    if (type === 'experience') return this.maxIndices().experience;
    if (type === 'class') return this.maxIndices().class;
    if (type === 'special') return this.maxIndices().special;
    return this.reviews.length - 1;
  }

  private calculateMaxIndices() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const newIndices = { ...this.maxIndices() };
    let changed = false;

    ['experience', 'class', 'special'].forEach(type => {
        const sliderEl = this.getSliderElement(type);
        const containerEl = sliderEl?.parentElement;
        if (!sliderEl || !containerEl) return;

        const containerWidth = containerEl.clientWidth;
        // Last element
        const lastCard = sliderEl.children[sliderEl.children.length - 1] as HTMLElement;
        if(!lastCard) return;

        const sliderStyle = window.getComputedStyle(sliderEl);
        const paddingRight = parseFloat(sliderStyle.paddingRight) || 0;
        const scrollableWidth = lastCard.offsetLeft + lastCard.offsetWidth + paddingRight;

        const slideWidth = this.getSlideWidth(type);
        if (slideWidth <= 0) return;

        let maxIndex = 0;
        if (scrollableWidth > containerWidth) {
            const maxScroll = scrollableWidth - containerWidth;
            maxIndex = Math.ceil(maxScroll / slideWidth);
        } else {
            maxIndex = 0;
        }
        
        if (newIndices[type as keyof typeof newIndices] !== maxIndex) {
            newIndices[type as keyof typeof newIndices] = maxIndex;
            changed = true;
        }
    });

    if (changed) {
        this.maxIndices.set(newIndices);
    }
  }
  
  private setIndex(type: string, index: number): void {
    if (type === 'review' || type === 'reviewLayer2') {
        const sliderEl = this.getSliderElement(type);
        if (!sliderEl) return;
        const slideWidth = this.getSlideWidth(type);
        const finalTranslate = -index * slideWidth;
        this.renderer.addClass(sliderEl, 'slider-transition');
        this.renderer.setStyle(sliderEl, 'transform', `translateX(${finalTranslate}px)`);
        if (this.sliderTransitionTimers[type]) clearTimeout(this.sliderTransitionTimers[type]);
        this.sliderTransitionTimers[type] = setTimeout(() => {
            if (type === 'review') this.checkReviewLoop();
            if(sliderEl) this.renderer.removeClass(sliderEl, 'slider-transition');
        }, 500);
        return;
    }
    const maxIndex = this.getMaxIndex(type);
    const newIndex = Math.max(0, Math.min(index, maxIndex));
    if (type === 'experience') this.experienceIndex.set(newIndex);
    else if (type === 'class') this.classIndex.set(newIndex);
    else if (type === 'special') this.specialIndex.set(newIndex);
    this.updateSliderPosition(type, true);
  }

  private getSliderBoundaries(type: 'experience' | 'class' | 'special'): { min: number, max: number } {
    const sliderEl = this.getSliderElement(type);
    const containerEl = sliderEl?.parentElement;
    if (!isPlatformBrowser(this.platformId) || !sliderEl || !containerEl || sliderEl.children.length === 0 || !containerEl.clientWidth) {
        return { min: 0, max: 0 };
    }
    const containerWidth = containerEl.clientWidth;
    const lastCard = sliderEl.children[sliderEl.children.length - 1] as HTMLElement;
    const sliderStyle = window.getComputedStyle(sliderEl);
    const paddingRight = parseFloat(sliderStyle.paddingRight) || 0;
    const scrollableWidth = lastCard.offsetLeft + lastCard.offsetWidth + paddingRight;

    if (scrollableWidth <= containerWidth) return { min: 0, max: 0 };
    return { min: containerWidth - scrollableWidth, max: 0 };
  }

  private updateSliderPosition(type: string, animated = false) {
    const sliderEl = this.getSliderElement(type);
    if (!sliderEl) return;

    if (animated) this.renderer.addClass(sliderEl, 'slider-transition');
    else this.renderer.removeClass(sliderEl, 'slider-transition');

    let index = 0;
    if (type === 'experience') index = this.experienceIndex();
    else if (type === 'class') index = this.classIndex();
    else if (type === 'special') index = this.specialIndex();
    else if (type === 'review') index = this.reviewIndex();
    else if (type === 'reviewLayer2') index = this.CLONE_COUNT; // Start at real items to allow reverse scrolling

    const slideWidth = this.getSlideWidth(type);
    let finalTranslate = -index * slideWidth;

    if (type === 'experience' || type === 'class' || type === 'special') {
        const boundaries = this.getSliderBoundaries(type as 'experience' | 'class' | 'special');
        finalTranslate = Math.max(boundaries.min, Math.min(finalTranslate, boundaries.max));
    }

    this.renderer.setStyle(sliderEl, 'transform', `translateX(${finalTranslate}px)`);

    if (animated && type !== 'review' && type !== 'reviewLayer2') {
      if (this.sliderTransitionTimers[type]) clearTimeout(this.sliderTransitionTimers[type]);
      this.sliderTransitionTimers[type] = setTimeout(() => {
          if(sliderEl) this.renderer.removeClass(sliderEl, 'slider-transition');
          this.sliderTransitionTimers[type] = null;
      }, 500);
    }
  }

  private checkReviewLoop(): void {
      const sliderEl = this.getSliderElement('review');
      if (!sliderEl) return;
      const slideWidth = this.getSlideWidth('review');
      if (slideWidth === 0) return;
      
      const currentTranslateX = this.getTranslateX(sliderEl); // Safely get translate
      const currentIndex = Math.abs(Math.round(currentTranslateX / slideWidth));

      const cloneCount = Math.min(this.reviews.length, this.CLONE_COUNT);
      const totalOriginals = this.reviews.length;

      if (currentIndex >= totalOriginals + cloneCount) {
          const newTranslate = currentTranslateX + (totalOriginals * slideWidth);
          this.renderer.removeClass(sliderEl, 'slider-transition');
          this.renderer.setStyle(sliderEl, 'transform', `translateX(${newTranslate}px)`);
      } 
      else if (currentIndex < cloneCount) {
          const newTranslate = currentTranslateX - (totalOriginals * slideWidth);
          this.renderer.removeClass(sliderEl, 'slider-transition');
          this.renderer.setStyle(sliderEl, 'transform', `translateX(${newTranslate}px)`);
      }
  }

  private getPositionX(event: MouseEvent | TouchEvent): number {
    return event.type.includes('mouse') ? (event as MouseEvent).pageX : (event as TouchEvent).touches[0].clientX;
  }
  
  private getPositionY(event: MouseEvent | TouchEvent): number {
    return event.type.includes('mouse') ? (event as MouseEvent).pageY : (event as TouchEvent).touches[0].clientY;
  }

  dragStart(event: MouseEvent | TouchEvent, type: 'experience' | 'class' | 'special' | 'review' | 'reviewLayer2') {
    const sliderEl = this.getSliderElement(type);
    if (!sliderEl?.parentElement) return;

    if (type === 'review') this.pauseReviewAutoScroll();
    if (type === 'reviewLayer2') this.pauseReviewAutoScrollLayer2();

    const state = this.sliderDragState[type];
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = undefined;
    }

    state.startTranslate = this.getTranslateX(sliderEl); // Use safe helper
    state.currentTranslate = state.startTranslate;
    state.isDragging = true;
    state.isScrolling = undefined;
    state.startX = this.getPositionX(event);
    state.startY = this.getPositionY(event);
    state.lastX = state.startX;
    state.lastTimestamp = performance.now();
    state.velocityX = 0;
    
    this.renderer.removeClass(sliderEl, 'slider-transition');
    this.renderer.addClass(sliderEl.parentElement, 'dragging');
  }

  dragging(event: MouseEvent | TouchEvent, type: 'experience' | 'class' | 'special' | 'review' | 'reviewLayer2') {
    const state = this.sliderDragState[type];
    if (!state.isDragging) return;
    if (state.isScrolling) return;

    const currentX = this.getPositionX(event);
    const currentY = this.getPositionY(event);

    if (state.isScrolling === undefined) {
        const dx = Math.abs(currentX - state.startX);
        const dy = Math.abs(currentY - state.startY);
        if (dx > 5 || dy > 5) {
            if (dy > dx) {
                state.isScrolling = true;
                state.isDragging = false;
                const sliderEl = this.getSliderElement(type);
                if (sliderEl?.parentElement) this.renderer.removeClass(sliderEl.parentElement, 'dragging');
                return;
            } else {
                state.isScrolling = false;
            }
        }
    }

    if (state.isScrolling === false && event.cancelable) event.preventDefault();
    if (state.isScrolling === undefined) return;

    const sliderEl = this.getSliderElement(type);
    if (!sliderEl) return;

    const diff = currentX - state.startX;
    const newTranslate = state.startTranslate + diff;

    if (type === 'experience' || type === 'class' || type === 'special') {
        const boundaries = this.getSliderBoundaries(type);
        state.currentTranslate = Math.max(boundaries.min, Math.min(newTranslate, boundaries.max));
    } else {
        state.currentTranslate = newTranslate;
    }

    const now = performance.now();
    const deltaTime = now - state.lastTimestamp;
    if (deltaTime > 16) {
        const deltaX = currentX - state.lastX;
        const newVelocity = (deltaX / deltaTime) * 1000;
        state.velocityX = 0.6 * newVelocity + 0.4 * state.velocityX;
        state.lastX = currentX;
        state.lastTimestamp = now;
    }
    
    this.renderer.setStyle(sliderEl, 'transform', `translateX(${state.currentTranslate}px)`);
  }
  
  dragEnd(type: 'experience' | 'class' | 'special' | 'review' | 'reviewLayer2') {
    const state = this.sliderDragState[type];
    if (!state.isDragging) return;
    state.isDragging = false;
    const sliderEl = this.getSliderElement(type);
    if (!sliderEl?.parentElement) return;

    this.renderer.removeClass(sliderEl.parentElement, 'dragging');

    if (type === 'experience' || type === 'class' || type === 'special') {
        this.startInertiaAnimation(type);
    } else {
      const movedBy = state.currentTranslate - state.startTranslate;
      const slideWidth = this.getSlideWidth(type);
      if (slideWidth > 0) {
        const dragThreshold = slideWidth / 4;
        let currentLogicalIndex = Math.round(Math.abs(state.startTranslate / slideWidth));
        let newIndex = currentLogicalIndex;
        if (movedBy < -dragThreshold) newIndex++;
        else if (movedBy > dragThreshold) newIndex--;
        this.setIndex(type, newIndex);
      }
    }
    if (type === 'review') this.resumeReviewAutoScroll(5000);
    if (type === 'reviewLayer2') this.resumeReviewAutoScrollLayer2(5000);
  }

  private startInertiaAnimation(type: 'experience' | 'class' | 'special') {
    const state = this.sliderDragState[type];
    const sliderEl = this.getSliderElement(type);
    if (!sliderEl) return;

    const friction = 0.94;
    const stopThreshold = 1;
    const boundaries = this.getSliderBoundaries(type);
    let lastFrameTime = performance.now();

    const animate = () => {
        const now = performance.now();
        const deltaTime = (now - lastFrameTime) / 1000;
        lastFrameTime = now;
        state.currentTranslate += state.velocityX * deltaTime;
        state.velocityX *= friction;

        if (state.currentTranslate > boundaries.max) {
            state.currentTranslate = boundaries.max;
            state.velocityX = 0;
        } else if (state.currentTranslate < boundaries.min) {
            state.currentTranslate = boundaries.min;
            state.velocityX = 0;
        }

        this.renderer.setStyle(sliderEl, 'transform', `translateX(${state.currentTranslate}px)`);

        if (Math.abs(state.velocityX) > stopThreshold) {
            state.animationFrameId = requestAnimationFrame(animate);
        } else {
            state.animationFrameId = undefined;
            this.updateIndexFromPosition(type);
        }
    };
    state.animationFrameId = requestAnimationFrame(animate);
  }

  private updateIndexFromPosition(type: 'experience' | 'class' | 'special') {
    const state = this.sliderDragState[type];
    const slideWidth = this.getSlideWidth(type);
    if (slideWidth > 0) {
        const finalIndex = Math.round(Math.abs(state.currentTranslate) / slideWidth);
        const maxItems = this.getMaxIndex(type);
        const clampedIndex = Math.max(0, Math.min(finalIndex, maxItems));
        if (type === 'experience') this.experienceIndex.set(clampedIndex);
        else if (type === 'class') this.classIndex.set(clampedIndex);
        else if (type === 'special') this.specialIndex.set(clampedIndex);
    }
  }

  pauseReviewAutoScroll() {
      this.isReviewSliderPaused.set(true);
      if (this.reviewAutoScrollTimeout) clearTimeout(this.reviewAutoScrollTimeout);
      if (this.reviewAnimationId) cancelAnimationFrame(this.reviewAnimationId);
      this.reviewAutoScrollTimeout = null;
      this.reviewAnimationId = null;
  }

  resumeReviewAutoScroll(delay: number = 0) {
      this.pauseReviewAutoScroll(); 
      this.reviewAutoScrollTimeout = setTimeout(() => {
          if (!this.sliderDragState['review'].isDragging) {
              this.isReviewSliderPaused.set(false);
              this.lastFrameTime = performance.now();
              this.animateReviews();
          }
      }, delay);
  }

  private animateReviews() {
      if (this.isReviewSliderPaused() || !isPlatformBrowser(this.platformId)) return;
      const sliderEl = this.getSliderElement('review');
      if (!sliderEl) return;
      const now = performance.now();
      const deltaTime = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;
      const slideWidth = this.getSlideWidth('review');
      if (slideWidth === 0) {
          this.reviewAnimationId = requestAnimationFrame(() => this.animateReviews());
          return;
      }
      let currentTranslateX = this.getTranslateX(sliderEl);
      currentTranslateX -= this.SCROLL_SPEED * deltaTime;
      const cloneCount = Math.min(this.reviews.length, this.CLONE_COUNT);
      const totalOriginals = this.reviews.length;
      const loopBoundary = -((totalOriginals + cloneCount) * slideWidth);
      if (currentTranslateX <= loopBoundary) currentTranslateX += totalOriginals * slideWidth;
      this.renderer.setStyle(sliderEl, 'transform', `translateX(${currentTranslateX}px)`);
      this.reviewAnimationId = requestAnimationFrame(() => this.animateReviews());
  }

  pauseReviewAutoScrollLayer2() {
      this.isReviewSliderLayer2Paused.set(true);
      if (this.reviewAutoScrollTimeoutLayer2) clearTimeout(this.reviewAutoScrollTimeoutLayer2);
      if (this.reviewLayer2AnimationId) cancelAnimationFrame(this.reviewLayer2AnimationId);
      this.reviewAutoScrollTimeoutLayer2 = null;
      this.reviewLayer2AnimationId = null;
  }

  resumeReviewAutoScrollLayer2(delay: number = 0) {
      this.pauseReviewAutoScrollLayer2(); 
      this.reviewAutoScrollTimeoutLayer2 = setTimeout(() => {
          if (!this.sliderDragState['reviewLayer2'].isDragging) {
              this.isReviewSliderLayer2Paused.set(false);
              this.lastFrameTimeLayer2 = performance.now();
              this.animateReviewsLayer2();
          }
      }, delay);
  }

  private animateReviewsLayer2() {
      if (this.isReviewSliderLayer2Paused() || !isPlatformBrowser(this.platformId)) return;
      const sliderEl = this.getSliderElement('reviewLayer2');
      if (!sliderEl) return;
      const now = performance.now();
      const deltaTime = (now - this.lastFrameTimeLayer2) / 1000;
      this.lastFrameTimeLayer2 = now;
      const slideWidth = this.getSlideWidth('reviewLayer2');
      if (slideWidth === 0) {
          this.reviewLayer2AnimationId = requestAnimationFrame(() => this.animateReviewsLayer2());
          return;
      }
      let currentTranslateX = this.getTranslateX(sliderEl);
      
      // Move RIGHT (Reverse)
      currentTranslateX += this.SCROLL_SPEED * deltaTime;

      const cloneCount = Math.min(this.reviewsLayer2.length, this.CLONE_COUNT);
      const totalOriginals = this.reviewsLayer2.length;
      
      // Loop logic for moving RIGHT
      if (currentTranslateX >= 0) {
          currentTranslateX -= totalOriginals * slideWidth;
      }

      this.renderer.setStyle(sliderEl, 'transform', `translateX(${currentTranslateX}px)`);
      this.reviewLayer2AnimationId = requestAnimationFrame(() => this.animateReviewsLayer2());
  }
  
  ngOnDestroy() {
      if (this.bannerInterval) clearInterval(this.bannerInterval);
      clearTimeout(this.animationTimeoutId);
      this.pauseReviewAutoScroll();
      this.pauseReviewAutoScrollLayer2();
      Object.keys(this.sliderTransitionTimers).forEach(key => {
        if(this.sliderTransitionTimers[key]) clearTimeout(this.sliderTransitionTimers[key]);
      });
      if (isPlatformBrowser(this.platformId)) {
        window.removeEventListener('resize', this.resizeListener); // Remove this as well
        const scrollEl = this.scrollContainer();
        if (scrollEl) scrollEl.nativeElement.removeEventListener('scroll', this.parallaxListener);
        if (this.unlistenMouseUp) this.unlistenMouseUp();
        if (this.unlistenTouchEnd) this.unlistenTouchEnd();
      }
      if (this.reviewCountObserver) this.reviewCountObserver.disconnect();
      if (this.scrollSpyObserver) this.scrollSpyObserver.disconnect();
      if (this.countUpAnimationId) cancelAnimationFrame(this.countUpAnimationId);
      clearTimeout(this.countUpRestartTimeoutId);
  }
}
