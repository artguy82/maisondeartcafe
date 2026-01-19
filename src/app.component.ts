import { Component, signal, OnInit, OnDestroy, inject, PLATFORM_ID, ElementRef, Renderer2, AfterViewInit, viewChild, ChangeDetectionStrategy, effect, Injector, ViewChild } from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { FirebaseService } from './app/firebase.service';

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
  id: string; // Unique identifier for likes
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
  minTranslate?: number; // Added for hard stop calculation
  maxTranslate?: number; // Added for hard stop calculation
}

interface ParallaxCache {
  el: HTMLElement;
  speed: number;
  sectionTop: number;
  sectionHeight: number;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()',
    '(document:mouseup)': 'onGlobalEnd($event)',
    '(document:touchend)': 'onGlobalEnd($event)',
    '(document:touchcancel)': 'onGlobalEnd($event)',
    '(document:mousemove)': 'onGlobalMove($event)',
    '(document:touchmove)': 'onGlobalMove($event)'
  }
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  isMenuOpen = signal(false);
  activeDesktopNav = signal<string | null>(null);

  isPopupOpen = signal(false);
  popupContent = signal<'terms' | 'privacy' | null>(null);

  isProgramPopupOpen = signal(false);
  selectedProgram = signal<ProgramItem | null>(null);
  programImageIndex = signal(0);
  
  openFaqIndex = signal<number | null>(null);

  isLikeBubbleVisible = signal(false);
  isLikeBubbleDismissed = signal(false);

  // New signal for Mobile Menu Button Color
  isMenuButtonDark = signal(false);
  
  currentYear = new Date().getFullYear();

  private platformId = inject(PLATFORM_ID);
  private firebaseService = inject(FirebaseService);
  isLikeFeatureAvailable = this.firebaseService.isAvailable;
  
  isDesktop = signal(false);
  private scrollUnlisteners: (() => void)[] = [];
  private injector = inject(Injector);
  private lastWindowWidth = 0; // To track width changes specifically
  
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
  reviewLayer2Index = signal(0);
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
  healingParallaxBg = viewChild<ElementRef<HTMLElement>>('healingParallaxBg');
  reviewParallaxBg = viewChild<ElementRef<HTMLElement>>('reviewParallaxBg');
  groupFooterParallaxBg = viewChild<ElementRef<HTMLElement>>('groupFooterParallaxBg');
  floatingImage1 = viewChild<ElementRef<HTMLElement>>('floatingImage1');
  floatingImage2 = viewChild<ElementRef<HTMLElement>>('floatingImage2');
  experienceSlider = viewChild<ElementRef<HTMLElement>>('experienceSlider');
  classSlider = viewChild<ElementRef<HTMLElement>>('classSlider');
  specialSlider = viewChild<ElementRef<HTMLElement>>('specialSlider');
  reviewSlider = viewChild<ElementRef<HTMLElement>>('reviewSlider');
  reviewSliderLayer2 = viewChild<ElementRef<HTMLElement>>('reviewSliderLayer2');
  reviewsSection = viewChild<ElementRef<HTMLElement>>('reviewsSection');
  popupImageSliderContainer = viewChild<ElementRef<HTMLElement>>('popupImageSliderContainer');
  
  private renderer = inject(Renderer2);
  private ticking = false;

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

  private readonly navSections = ['intro', 'programs', 'group', 'faq', 'contact'];
  private readonly allScrollSections = ['home', 'intro', 'healing-art', 'programs', 'reviews', 'group', 'faq', 'quote-divider', 'contact'];
  // Sections with dark backgrounds where the button should be light (white)
  private readonly darkSections = new Set(['home', 'healing-art', 'quote-divider', 'contact']);
  
  private sectionOffsets = new Map<string, number>();

  // Performance optimization: Cache viewport height to avoid layout thrashing during scroll events
  private viewportHeight = 0;

  likeCounts = signal<Record<string, number>>({});
  likedPrograms = signal<Set<string>>(new Set());

  // Base counts for programs to simulate popularity
  private initialLikeCountsMap: Record<string, number> = {
    '대형 도안 채색': 187,
    '캔버스 아크릴 드로잉': 202,
    '백드롭 페인팅': 241,
    '아트토이 베어브릭': 197,
    '오일 파스텔': 129,
    '액션! 추상 백드롭 페인팅': 21,
    '발포세라믹 오브제 아트': 17,
    '아로마 캔들 아트': 147,
    '테라리움 힐링 아트': 55,
    '아트티콘(기프티콘)': 139,
    '초등 방과후 창작 놀이터': 38,
    '취미 드로잉 프로젝트': 19
  };
  
  private preloadedPrograms = new Set<string>();
  private parallaxCache: ParallaxCache[] = [];

  private slugify(text: string): string {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-\uac00-\ud7a3]+/g, '') // Remove all non-word chars, but keep Korean
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  }

  experiences: ProgramItem[] = [
    { 
      id: this.slugify('대형 도안 채색'),
      title: '대형 도안 채색', 
      desc: '거대한 도안이 그려진 종이에 나만의 색을 입히는 몰입형 체험', 
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
      id: this.slugify('캔버스 아크릴 드로잉'),
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
      id: this.slugify('백드롭 페인팅'),
      title: '백드롭 페인팅', 
      desc: '질감 보조제를 활용한 트렌디한 입체화 그리기', 
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
      id: this.slugify('아트토이 베어브릭'),
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
      id: this.slugify('오일 파스텔'),
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
      id: this.slugify('액션! 추상 백드롭 페인팅'),
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
      id: this.slugify('발포세라믹 오브제 아트'),
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
      id: this.slugify('아로마 캔들 아트'),
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
      id: this.slugify('테라리움 힐링 아트'),
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
      id: this.slugify('아트티콘(기프티콘)'),
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
      id: this.slugify('초등 방과후 창작 놀이터'),
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
      id: this.slugify('취미 드로잉 프로젝트'),
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
    { name: '안** 님', date: '1달 전', content: '아이가 만든 베어브릭, 집에 오자마다 제일 잘 보이는 곳에 장식했어요. 자기 작품이라며 애지중지하는 모습이 너무 귀엽네요. 아이들 창의력 키우기에도 좋은 것 같아요.', rating: 5, avatar: 'https://picsum.photos/seed/avatar14/40/40', program: '아트토이 베어브릭' },
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
    { question: '예약은 꼭 해야 하나요?', answer: '네, 다른 이용자들과의 혼선을 막고 원활한 체험 진행을 위해 네이버 예약제를 운영하고 있습니다. 당일 예약은 체험 1시간 전까지 가능합니다.' },
    { question: '보호자 입장권은 필수 인가요?', answer: '메종디아트 입실시 1인 1체험으로 운영 되고 있습니다. 예외적으로 미취학 아동 체험시 부모 동반 입장하여 함께 체험 할 수 있도록 운영 되고 있으며 이때, 보호자 입장권을 구매 하시면 됩니다. (보호자 입장권에는 시그니쳐 메뉴를 제외한 음료가 포함 되어 있습니다.)' },
    { question: '그림을 못 그려도 괜찮나요?', answer: '물론입니다! 메종디아트의 도안과 가이드가 있어 초보자도 멋진 작품을 완성할 수 있습니다. 전문가의 코칭도 도와드립니다.' },
    { question: '소요 시간은 얼마나 걸리나요?', answer: '프로그램마다 다르지만 보통 1시간 30분에서 2시간 정도 소요됩니다. 개인차에 따라 조금씩 달라질 수 있습니다.' },
    { question: '주차는 가능한가요?', answer: '네, 건물 내 주차타워를 무료로 이용하실 수 있습니다. 대형 & SUV 차량의 경우 별도 문의 부탁드립니다.' },
    { question: '단체 예약도 가능한가요?', answer: '네, 기업 워크샵, 동호회 등 단체 체험 및 대관이 가능합니다. 전화로 문의 주시면 자세한 상담 도와드리겠습니다.' },
    { question: '재방문 50% 할인은 어떻게 해야 하나요?', answer: '재방문 50% 할인과 같은 예약 메뉴가 없는 서비스 일 경우 네이버예약의 \'방문예약\' 메뉴로 간략한 메모와 함께 예약 하고 오시면 할인/상담 도와 드립니다.' },
    { question: '네이버 예약이 낯설어서 그냥 방문 하면 안되나요?', answer: '매장에 오셔서 체험 진행도 가능은 하지만 이용자님들과 혼선이 있거나 체험 공간이 없어 체험진행이 어려울 수 있습니다. 프로그램 선택이 어려우시면 \'방문예약\'을 하시고 오셔서 상담 하셔도 됩니다.' },
    { question: '몇 세 부터 체험 가능 한가요?', answer: '아트를 즐기는 나이는 따로 없답니다. 붓을 들수 있는 나이면 누구나 체험 가능 하며 4세도 엄마와 함께 체험 가능 합니다. 커플, 회사원, 주부, 부모님 모두 즐겁게 체험 가능 합니다.' }
  ];

  ngOnInit() {
    // 1. Initialize local base counts
    const baseCounts: Record<string, number> = {};
    for (const [title, count] of Object.entries(this.initialLikeCountsMap)) {
      baseCounts[this.slugify(title)] = count;
    }
    this.likeCounts.set(baseCounts);

    if (isPlatformBrowser(this.platformId)) {
      this.isDesktop.set(window.innerWidth >= 768);
      
      if (this.isLikeFeatureAvailable()) {
        // Fetch total counts first
        this.firebaseService.getLikes().then(counts => {
          // 2. Merge server counts with base counts
          this.likeCounts.update(current => {
            const merged = { ...current };
            for (const [id, count] of Object.entries(counts)) {
              merged[id] = (merged[id] || 0) + count;
            }
            return merged;
          });
        });
        
        // Then get the current user's specific likes
        this.firebaseService.getLikedProgramsForCurrentUser().then(likedSet => {
          this.likedPrograms.set(likedSet);
        });
      }
    }
    
    // Fill dummy data for demonstration if arrays are small
    while(this.reviews.length < 10) this.reviews = [...this.reviews, ...this.reviews];
    while(this.reviewsLayer2.length < 10) this.reviewsLayer2 = [...this.reviewsLayer2, ...this.reviewsLayer2];

    this.setupInfiniteReviewSlider();
    this.setupInfiniteReviewSliderLayer2();
    
    this.currentWordIndex.set(Math.floor(Math.random() * this.rollingWords.length));

    this.bannerInterval = setInterval(() => {
        const nextIndex = (this.currentBannerIndex() + 1) % this.bannerImages.length;
        this.preloadImage(this.bannerImages[nextIndex]); // Preload the NEXT image
        this.currentBannerIndex.set(nextIndex);
    }, 7000);

    this.startTypingAnimationLoop();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.lastWindowWidth = window.innerWidth; // Initialize width
      
      // Calculate initial viewport height
      this.viewportHeight = this.isDesktop() ? this.scrollContainer()!.nativeElement.offsetHeight : window.innerHeight;
      
      // Explicit JS preload removed as NgOptimizedImage priority handles LCP better
      // and we want to avoid double-fetching logic.

      effect(() => {
        this.isDesktop(); // Establish dependency on the signal
        this.setupScrollListeners();
      }, { injector: this.injector });

      effect(() => {
        // Body scroll lock for mobile menu
        if (!this.isDesktop() && this.isMenuOpen()) {
            this.renderer.addClass(document.body, 'overflow-hidden');
        } else {
            // Only remove the class if no popups are open.
            // This prevents the menu from interfering with popup scroll lock.
            if (!this.isPopupOpen() && !this.isProgramPopupOpen()) {
                this.renderer.removeClass(document.body, 'overflow-hidden');
            }
        }
      }, { injector: this.injector });

      this.unlistenMouseUp = this.renderer.listen('window', 'mouseup', () => this.handleDragEnd());
      this.unlistenTouchEnd = this.renderer.listen('window', 'touchend', () => this.handleDragEnd());

      // Initial layout setup
      setTimeout(() => {
        this.calculateMaxIndices();
        this.calculateSectionOffsets();
        this.initParallaxCache();
        this.updateActiveNavOnScroll();
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

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      this.scrollUnlisteners.forEach(unlisten => unlisten());
      this.unlistenMouseUp?.();
      this.unlistenTouchEnd?.();
      this.reviewCountObserver?.disconnect();
    }
    
    clearInterval(this.bannerInterval);
    clearTimeout(this.animationTimeoutId);
    
    if (this.reviewAnimationId) cancelAnimationFrame(this.reviewAnimationId);
    if (this.reviewLayer2AnimationId) cancelAnimationFrame(this.reviewLayer2AnimationId);
    if (this.countUpAnimationId) cancelAnimationFrame(this.countUpAnimationId);
    clearTimeout(this.countUpRestartTimeoutId);
    clearTimeout(this.reviewAutoScrollTimeout);
    clearTimeout(this.reviewAutoScrollTimeoutLayer2);
    Object.values(this.sliderTransitionTimers).forEach(timer => clearTimeout(timer));
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
    if (!isPlatformBrowser(this.platformId)) return;

    // Fix: Ignore resize events where only height changes (e.g., mobile address bar toggle)
    // This prevents sliders from resetting and images from jittering on scroll
    const currentWidth = window.innerWidth;
    if (currentWidth === this.lastWindowWidth) return;
    this.lastWindowWidth = currentWidth;

    this.isDesktop.set(window.innerWidth >= 768);
    
    // Update cached viewport height on resize
    this.viewportHeight = this.isDesktop() ? this.scrollContainer()!.nativeElement.offsetHeight : window.innerHeight;
    
    this.calculateMaxIndices();
    this.calculateSectionOffsets();
    this.initParallaxCache();
    
    // Only update static sliders.
    // Review sliders are auto-scrolling and handled by animation loop, so we don't force-update them here.
    this.updateSliderPosition('experience', false);
    this.updateSliderPosition('class', false);
    this.updateSliderPosition('special', false);
    // Removed: this.updateSliderPosition('review', false); 
    // Removed: this.updateSliderPosition('reviewLayer2', false);
  }

  hideLikeBubble() {
    this.isLikeBubbleDismissed.set(true);
    this.isLikeBubbleVisible.set(false);
  }

  async handleLike(program: ProgramItem, event: MouseEvent) {
    event.stopPropagation();
    if (!this.firebaseService.isUserAuthenticated()) {
      console.warn("User not authenticated yet, cannot like.");
      // Optionally, show a message to the user
      return;
    }
    
    const programId = program.id;
    const isCurrentlyLiked = this.likedPrograms().has(programId);

    // Optimistic UI Update
    this.likedPrograms.update(currentSet => {
      const newSet = new Set(currentSet);
      if (isCurrentlyLiked) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });

    this.likeCounts.update(currentCounts => {
      const newCounts = { ...currentCounts };
      const currentCount = newCounts[programId] || 0;
      newCounts[programId] = isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
      return newCounts;
    });

    // Sync with Firebase
    const result = await this.firebaseService.toggleLike(programId);

    // Handle potential errors from the backend
    if (result === 'error') {
      console.error(`Failed to sync like status for ${programId}. Reverting UI.`);
      // Revert UI changes if the Firebase operation failed
      this.likedPrograms.update(currentSet => {
        const newSet = new Set(currentSet);
        if (isCurrentlyLiked) {
          newSet.add(programId); // It was liked, we tried to unlike, so add it back
        } else {
          newSet.delete(programId); // It wasn't liked, we tried to like, so delete it
        }
        return newSet;
      });
       this.likeCounts.update(currentCounts => {
        const newCounts = { ...currentCounts };
        const currentCount = newCounts[programId] || (isCurrentlyLiked ? 0 : 1);
        newCounts[programId] = isCurrentlyLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
        return newCounts;
      });
    }
  }
  
  private handleDragEnd(): void {
    if (this.sliderDragState.experience.isDragging) this.dragEnd('experience');
    if (this.sliderDragState.class.isDragging) this.dragEnd('class');
    if (this.sliderDragState.special.isDragging) this.dragEnd('special');
    if (this.sliderDragState.review.isDragging) this.dragEnd('review');
    if (this.sliderDragState.reviewLayer2.isDragging) this.dragEnd('reviewLayer2');
    if (this.popupImageDragState.isDragging) this.popupImageDragEnd();
  }

  private setupScrollListeners() {
    // Cleanup previous listeners
    this.scrollUnlisteners.forEach(unlisten => unlisten());
    this.scrollUnlisteners = [];

    const scrollTarget = this.isDesktop() ? this.scrollContainer()?.nativeElement : window;

    if (scrollTarget) {
      const scrollHandler = () => {
        if (!this.ticking) {
          window.requestAnimationFrame(() => {
            this.updateParallax();
            this.updateActiveNavOnScroll();
            this.ticking = false;
          });
          this.ticking = true;
        }
      };
      this.scrollUnlisteners.push(
        this.renderer.listen(scrollTarget, 'scroll', scrollHandler)
      );
    }
  }
  
  private getScrollTop(): number {
    if (this.isDesktop()) {
        return this.scrollContainer()?.nativeElement.scrollTop ?? 0;
    }
    return window.scrollY || document.documentElement.scrollTop;
  }

  private calculateSectionOffsets() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.sectionOffsets.clear();
    
    this.allScrollSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (this.isDesktop()) {
                // In desktop mode, offsetTop is relative to the scrolling container (<main>), which is correct.
                this.sectionOffsets.set(id, (el as HTMLElement).offsetTop);
            } else {
                // In mobile/tablet mode, the window is the scroll context. We need the absolute position from the top of the document.
                this.sectionOffsets.set(id, el.getBoundingClientRect().top + window.scrollY);
            }
        }
    });
  }

  private updateActiveNavOnScroll() {
    const scrollTop = this.getScrollTop();
    const windowWidth = isPlatformBrowser(this.platformId) ? window.innerWidth : 1024;
    const isStickyNavVisible = windowWidth >= 768;
    const defaultBuffer = isStickyNavVisible ? 53 : 10;

    // --- Nav Highlight Logic ---
    let currentNavId: string | null = null;
    let lastSectionId: string | null = null;

    for (const [id, offsetTop] of this.sectionOffsets.entries()) {
      // Use a specific buffer for the 'contact' section to match its scroll-to position.
      const sectionBuffer = (id === 'contact' && isStickyNavVisible) ? 45 : defaultBuffer;
      const triggerOffset = scrollTop + sectionBuffer;
      
      if (offsetTop <= triggerOffset) {
        if (this.navSections.includes(id)) {
          currentNavId = id;
        }
        lastSectionId = id;
      } else {
        break;
      }
    }

    // Edge case: If scrolled to the absolute bottom, force 'contact' to be active.
    if (isPlatformBrowser(this.platformId)) {
      if (this.isDesktop()) {
        const scrollEl = this.scrollContainer()?.nativeElement;
        // Use a small buffer (e.g., 2px) for floating point inaccuracies
        if (scrollEl && (scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 2)) {
            currentNavId = 'contact';
        }
      } else {
        // For mobile/tablet, use window properties which are more reliable
        const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        if (scrollHeight - scrollTop - window.innerHeight < 2) {
          currentNavId = 'contact';
        }
      }
    }
    
    this.activeDesktopNav.set(currentNavId);


    // --- Mobile Menu Button Color Logic ---
    const buttonTriggerPoint = scrollTop + 32; // Approx center of header
    let currentSectionIdForButton = 'home';
    for (const id of this.allScrollSections) {
        const offset = this.sectionOffsets.get(id) ?? 0;
        if (offset <= buttonTriggerPoint) {
            currentSectionIdForButton = id;
        } else {
            break;
        }
    }
    // If section is NOT in darkSections, background is light, so button should be dark.
    this.isMenuButtonDark.set(!this.darkSections.has(currentSectionIdForButton));

    // --- Mobile Like Bubble Visibility Logic (More Robust) ---
    if (this.isLikeBubbleDismissed()) {
        this.isLikeBubbleVisible.set(false);
        return;
    }

    if (this.isDesktop()) {
        // Desktop: use simple section detection
        this.isLikeBubbleVisible.set(lastSectionId === 'programs');
    } else {
        // Mobile: use precise bounding box to handle dynamic heights/layout shifts
        const programsEl = document.getElementById('programs');
        if (programsEl) {
            const rect = programsEl.getBoundingClientRect();
            // Trigger when the top of the section is near the top of the viewport (e.g., under the header)
            // and the section is still visible.
            // 100px buffer allows it to trigger just before it hits the very top, or while it's passing.
            const isVisible = rect.top <= 0 && rect.bottom > 64;
            this.isLikeBubbleVisible.set(isVisible);
        } else {
            this.isLikeBubbleVisible.set(false);
        }
    }
  }

  private getTranslateX(element: HTMLElement): number {
    if (!isPlatformBrowser(this.platformId)) return 0;
    const style = window.getComputedStyle(element);
    const transform = style.transform;
    if (transform === 'none' || !transform) return 0;
    const mat = transform.match(/^matrix\((.+)\)$/);
    if (mat) return parseFloat(mat[1].split(', ')[4]);
    const mat3d = transform.match(/^matrix3d\((.+)\)$/);
    if (mat3d) return parseFloat(mat3d[1].split(', ')[12]);
    return 0;
  }

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
    this.reviewLayer2Index.set(cloneCount);
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

  private initParallaxCache() {
      if (!isPlatformBrowser(this.platformId)) return;
      
      this.parallaxCache = [];
      const add = (elRef: ElementRef<HTMLElement> | undefined, speed: number) => {
          if (!elRef) return;
          const el = elRef.nativeElement;
          const section = el.closest('section') as HTMLElement;
          if (!section) return;
          
          let sectionTop = 0;
          if (this.isDesktop()) {
            // In Desktop mode, 'main' is the scroll container and sections are relative to it.
            sectionTop = section.offsetTop;
          } else {
            // In Mobile mode, window is the scroll container.
            // We cache the absolute position in the document to avoid layout thrashing.
            // Note: This needs re-calc on resize (which handles this fn call)
            sectionTop = section.getBoundingClientRect().top + window.scrollY;
          }

          this.parallaxCache.push({
              el,
              speed,
              sectionTop: sectionTop,
              sectionHeight: section.offsetHeight
          });
      };

      add(this.parallaxBg(), -0.2);
      add(this.healingParallaxBg(), -0.1); // Reduced from -0.15 to match smaller height
      add(this.reviewParallaxBg(), -0.1);
      add(this.groupFooterParallaxBg(), -0.05);
      add(this.floatingImage1(), 0.1);
      add(this.floatingImage2(), -0.1);
  }

  private updateParallax() {
    const scrollTop = this.getScrollTop();
    // Optimized: Use cached viewportHeight instead of reading DOM (window.innerHeight/offsetHeight)
    // This prevents layout thrashing during the scroll loop.
    const height = this.viewportHeight;

    for (const item of this.parallaxCache) {
        const sectionTopRelativeToVisible = item.sectionTop - scrollTop;
        // Check visibility with a bit of buffer
        if (sectionTopRelativeToVisible < height && sectionTopRelativeToVisible > -item.sectionHeight) {
            const translateY = sectionTopRelativeToVisible * item.speed;
            // Use translate3d for GPU acceleration
            item.el.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`; 
        }
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

    const targetElement = document.getElementById(sectionId);
    if (!targetElement) {
        console.error(`Could not find element for section: ${sectionId}`);
        return;
    }

    if (sectionId === 'intro') {
      const scrollContainer = this.isDesktop() ? this.scrollContainer()?.nativeElement : window;

      if (this.isDesktop() && scrollContainer instanceof HTMLElement) {
        // Desktop mode: scroll within the <main> container. 
        // offsetTop is correct here since sections are direct children.
        scrollContainer.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth'
        });
      } else {
        // Mobile/Tablet mode: scroll the window.
        // getBoundingClientRect is more robust for calculating scroll position.
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      // Default behavior for all other sections, respecting scroll-padding-top
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  private getSliderElement(sliderName: string): HTMLElement | undefined {
    switch (sliderName) {
      case 'experience': return this.experienceSlider()?.nativeElement;
      case 'class': return this.classSlider()?.nativeElement;
      case 'special': return this.specialSlider()?.nativeElement;
      case 'review': return this.reviewSlider()?.nativeElement;
      case 'reviewLayer2': return this.reviewSliderLayer2()?.nativeElement;
      default: return undefined;
    }
  }
  
  private calculateMaxIndices() {
    if (!isPlatformBrowser(this.platformId)) return;

    const calculate = (sliderName: string): number => {
        const sliderEl = this.getSliderElement(sliderName);
        const container = sliderEl?.parentElement;
        if (!sliderEl || !container) return 0;
        
        const firstChild = sliderEl.firstElementChild as HTMLElement;
        if (!firstChild) return 0;

        // Get container padding to ensure we scroll enough to show visual balance
        const style = window.getComputedStyle(sliderEl);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;

        const childWidth = firstChild.offsetWidth;
        // Use parseFloat for gap to ensure precision (parseInt might strip 1.5rem to 1)
        const gap = parseFloat(style.gap || '0');
        const itemWidth = childWidth + gap;
        
        // Total visible width of the container
        const containerWidth = container.clientWidth;
        
        // Total width of all items
        const itemCount = sliderEl.children.length;
        const totalContentWidth = (itemCount * childWidth) + ((itemCount - 1) * gap);
        
        // If content fits, no sliding needed
        if (totalContentWidth <= containerWidth) return 0;

        // Maximum scrollable pixels including padding for balance
        const maxScroll = Math.max(0, totalContentWidth + paddingLeft + paddingRight - containerWidth);
        
        // If remaining scroll is very small (e.g. just padding/gap adjustments), don't create a whole new step
        const rawSteps = maxScroll / itemWidth;
        const floorSteps = Math.floor(rawSteps);
        const remainder = maxScroll - (floorSteps * itemWidth);
        
        // Threshold: if less than 10% of item width or 20px, round down.
        // This avoids creating a "Next" step that only moves the slider 1px.
        return (remainder < 20 || remainder < itemWidth * 0.1) ? floorSteps : Math.ceil(rawSteps);
    };
    
    this.maxIndices.update(current => ({
        experience: calculate('experience'),
        class: calculate('class'),
        special: calculate('special'),
    }));
  }

  private updateSliderPosition(sliderName: 'experience' | 'class' | 'special' | 'review' | 'reviewLayer2', transition: boolean = true) {
    const sliderEl = this.getSliderElement(sliderName);
    if (!sliderEl) return;
    
    const firstChild = sliderEl.firstElementChild as HTMLElement;
    if (!firstChild) return;
    
    const childWidth = firstChild.offsetWidth;
    const style = window.getComputedStyle(sliderEl);
    // Use parseFloat for gap
    const gap = parseFloat(style.gap || '0');

    let targetTranslateX: number;

    if (sliderName === 'review') {
        targetTranslateX = -this.reviewIndex() * (childWidth + gap);
    } else if (sliderName === 'reviewLayer2') {
        targetTranslateX = -this.reviewLayer2Index() * (childWidth + gap);
    } else {
        const indexSignal = this[`${sliderName}Index` as keyof this] as any;
        const index = indexSignal();
        targetTranslateX = -index * (childWidth + gap);

        // Clamping Logic for Non-Infinite Sliders
        // Ensure that button navigation does not overshoot the visual hard-stop limit
        const container = sliderEl.parentElement;
        if (container) {
            const paddingLeft = parseFloat(style.paddingLeft) || 0;
            const paddingRight = parseFloat(style.paddingRight) || 0;
            const itemCount = sliderEl.children.length;
            const totalContentWidth = (itemCount * childWidth) + ((itemCount - 1) * gap);
            const containerWidth = container.clientWidth;
            
            // Calculate exact same boundary used in dragStart
            const maxScroll = Math.max(0, totalContentWidth + paddingLeft + paddingRight - containerWidth);
            const minTranslate = -maxScroll;
            
            // Clamp targetTranslateX so it's not "more negative" than minTranslate
            if (targetTranslateX < minTranslate) {
                targetTranslateX = minTranslate;
            }
        }
    }
    
    // Explicitly sync the state here to ensure buttons work after a drag
    if(this.sliderDragState[sliderName]) {
        this.sliderDragState[sliderName].currentTranslate = targetTranslateX;
        this.sliderDragState[sliderName].isDragging = false; // Force clear dragging state just in case
    }

    if (transition) this.renderer.addClass(sliderEl, 'slider-transition');
    else this.renderer.removeClass(sliderEl, 'slider-transition');
    
    this.renderer.setStyle(sliderEl, 'transform', `translateX(${targetTranslateX}px)`);
    
    if (transition) {
        if (this.sliderTransitionTimers[sliderName]) clearTimeout(this.sliderTransitionTimers[sliderName]);
        this.sliderTransitionTimers[sliderName] = setTimeout(() => {
            this.renderer.removeClass(sliderEl, 'slider-transition');
        }, 500);
    }
  }

  public dragging(event: MouseEvent | TouchEvent, sliderName: string) {
    const state = this.sliderDragState[sliderName];
    if (!state || !state.isDragging) return;
    
    const clientX = event.type.startsWith('touch') ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX;
    const clientY = event.type.startsWith('touch') ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY;
    
    if (state.isScrolling === undefined) {
      const deltaX = Math.abs(clientX - state.startX);
      const deltaY = Math.abs(clientY - state.startY);
      // Wait for a small threshold to decide intent
      if (deltaX > 5 || deltaY > 5) {
          state.isScrolling = deltaY > deltaX;
      }
    }

    // If decided that it IS a vertical scroll (page scroll)
    if (state.isScrolling === true) {
      this.dragEnd(sliderName);
      return;
    }
    
    // If we are here, it is either undecided or horizontal drag.
    // Prevent default to stop browser navigation or native scroll interference
    if (event.cancelable && state.isScrolling === false) {
        event.preventDefault();
    } else if (!event.type.startsWith('touch')) {
        event.preventDefault(); // Always prevent for mouse to avoid text selection
    }

    // If still undecided, don't move yet
    if (state.isScrolling === undefined) return;

    const currentX = clientX;
    const diff = currentX - state.startX;
    let newTranslate = state.startTranslate + diff;
    
    // Hard stop logic using pre-calculated boundaries
    if (state.maxTranslate !== undefined && newTranslate > state.maxTranslate) {
      newTranslate = state.maxTranslate; // Sticky stop
      // Optional: Add resistance effect here if desired (newTranslate = state.maxTranslate + (overDrag / 3))
    }
    if (state.minTranslate !== undefined && newTranslate < state.minTranslate) {
      newTranslate = state.minTranslate; // Sticky stop
    }

    state.currentTranslate = newTranslate;

    const sliderEl = this.getSliderElement(sliderName);
    if (sliderEl) {
      this.renderer.setStyle(sliderEl, 'transform', `translateX(${state.currentTranslate}px)`);
    }

    const now = performance.now();
    const timeDelta = now - state.lastTimestamp;
    
    if (timeDelta > 0) {
        const posDelta = currentX - state.lastX;
        // Simple smoothing for velocity calculation
        const currentVelocity = (posDelta / timeDelta) * (1000 / 60);
        // Blend new velocity with previous (20% old, 80% new) to smooth out jitters
        state.velocityX = (state.velocityX * 0.2) + (currentVelocity * 0.8);
        
        state.lastX = currentX;
        state.lastTimestamp = now;
    }
  }

  private dragEnd(sliderName: string) {
    const state = this.sliderDragState[sliderName];
    if (!state || !state.isDragging) return;
    state.isDragging = false;
    
    const sliderEl = this.getSliderElement(sliderName);
    const sliderContainer = sliderEl?.parentElement;
    if (sliderContainer) this.renderer.removeClass(sliderContainer, 'dragging');

    if (sliderName.startsWith('review')) {
        this.handleReviewDragEnd(sliderName as 'review' | 'reviewLayer2');
        return;
    }
    
    const firstChild = sliderEl?.firstElementChild as HTMLElement;
    if (!firstChild) return;

    const childWidth = firstChild.offsetWidth;
    // Use parseFloat for gap
    const gap = parseFloat(window.getComputedStyle(sliderEl).gap || '0');
    const itemWidth = childWidth + gap;
    if (itemWidth <= 0) return;

    // Use a standard multiplier (5) for predictable kinetic scroll effect.
    let projectedTranslate = state.currentTranslate + state.velocityX * 5;
    
    const indexSignal = (this as any)[`${sliderName}Index`];
    const maxIndex = this.maxIndices()[sliderName as keyof typeof this.maxIndices];

    let newIndex = Math.round(-projectedTranslate / itemWidth);
    
    // Check if we are physically at the "hard stop" limit. 
    // If projectedTranslate pushes us past minTranslate (visual end), snap to maxIndex.
    if (state.minTranslate !== undefined && projectedTranslate < state.minTranslate + 5) {
       newIndex = maxIndex;
    }

    // Clamp index to respect boundaries strictly
    newIndex = Math.max(0, Math.min(newIndex, maxIndex));

    indexSignal.set(newIndex);
    this.updateSliderPosition(sliderName as any, true);
  }

  private handleReviewDragEnd(sliderName: 'review' | 'reviewLayer2') {
    if (sliderName === 'review') this.resumeReviewAutoScroll(1000);
    if (sliderName === 'reviewLayer2') this.resumeReviewAutoScrollLayer2(1000);

    const state = this.sliderDragState[sliderName];
    const sliderEl = this.getSliderElement(sliderName);
    if (!sliderEl) return;

    const firstChild = sliderEl.firstElementChild as HTMLElement;
    if (!firstChild) return;

    const itemWidth = firstChild.offsetWidth;
    // Use parseFloat for gap
    const gap = parseFloat(window.getComputedStyle(sliderEl).gap || '0');
    const itemWidthWithGap = itemWidth + gap;
    const originalItems = sliderName === 'review' ? this.reviews : this.reviewsLayer2;
    const totalContentWidth = originalItems.length * itemWidthWithGap;
    let currentTranslate = state.currentTranslate;

    if (sliderName === 'review') {
        const wrapPoint = -(totalContentWidth + (this.CLONE_COUNT * itemWidthWithGap));
        if (currentTranslate <= wrapPoint) {
            currentTranslate += totalContentWidth;
            this.renderer.setStyle(sliderEl, 'transform', `translateX(${currentTranslate}px)`);
            this.reviewIndex.update(i => i - originalItems.length);
        }
        const startPoint = -(this.CLONE_COUNT * itemWidthWithGap);
        if(currentTranslate > startPoint) {
            currentTranslate -= totalContentWidth;
            this.renderer.setStyle(sliderEl, 'transform', `translateX(${currentTranslate}px)`);
            this.reviewIndex.update(i => i + originalItems.length);
        }
    } else { 
        // Layer 2 Moves RIGHT.
        // Wrap when hitting start of ClonesStart (offset 0).
        const wrapPoint = 0;
        if (currentTranslate >= wrapPoint) {
            currentTranslate -= totalContentWidth;
            this.renderer.setStyle(sliderEl, 'transform', `translateX(${currentTranslate}px)`);
            this.reviewLayer2Index.update(i => i + originalItems.length);
        }
        const startPoint = -(totalContentWidth + (this.CLONE_COUNT * itemWidthWithGap));
        if (currentTranslate < startPoint) {
            currentTranslate += totalContentWidth;
            this.renderer.setStyle(sliderEl, 'transform', `translateX(${currentTranslate}px)`);
            this.reviewLayer2Index.update(i => i - originalItems.length);
        }
    }
    state.currentTranslate = currentTranslate;
  }

  private popupImageDragging(event: MouseEvent | TouchEvent) {
    if (!this.popupImageDragState.isDragging) return;

    const clientX = event.type.startsWith('touch') ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX;
    const clientY = event.type.startsWith('touch') ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY;
    
    if (this.popupImageDragState.isScrolling === undefined) {
      const deltaX = Math.abs(clientX - this.popupImageDragState.startX);
      const deltaY = Math.abs(clientY - this.popupImageDragState.startY);
      if (deltaX > 5 || deltaY > 5) {
          this.popupImageDragState.isScrolling = deltaY > deltaX;
      }
    }

    if (this.popupImageDragState.isScrolling) return;
    
    if (event.cancelable) event.preventDefault();

    const diff = clientX - this.popupImageDragState.startX;
    const newTranslate = this.popupImageDragState.startTranslate + diff;
    this.popupImageTranslateX.set(newTranslate);
  }

  private popupImageDragEnd() {
    if (!this.popupImageDragState.isDragging) return;

    this.popupImageDragState.isDragging = false;
    this.popupImageSliderTransition.set(true);

    const sliderEl = this.popupImageSliderContainer()?.nativeElement;
    if (!sliderEl) return;

    const itemWidth = sliderEl.offsetWidth;
    const dragDistance = this.popupImageTranslateX() - this.popupImageDragState.startTranslate;
    let newIndex = this.programImageIndex();
    if (Math.abs(dragDistance) > itemWidth * 0.3) {
        newIndex += dragDistance < 0 ? 1 : -1;
    }
    const maxIndex = (this.selectedProgram()?.images?.length || 1) - 1;
    newIndex = Math.max(0, Math.min(newIndex, maxIndex));
    this.programImageIndex.set(newIndex);
    this.popupImageTranslateX.set(-newIndex * itemWidth);
  }

  public pauseReviewAutoScroll() {
    this.isReviewSliderPaused.set(true);
    if (this.reviewAutoScrollTimeout) clearTimeout(this.reviewAutoScrollTimeout);
  }

  public resumeReviewAutoScroll(delay: number = 0) {
    if (this.reviewAutoScrollTimeout) clearTimeout(this.reviewAutoScrollTimeout);
    this.reviewAutoScrollTimeout = setTimeout(() => {
      this.isReviewSliderPaused.set(false);
      this.lastFrameTime = performance.now();
      if (!this.reviewAnimationId) {
        this.reviewAnimationId = requestAnimationFrame((t) => this.animateReviewScroll(t));
      }
    }, delay);
  }

  private animateReviewScroll(timestamp: number) {
    if (this.isReviewSliderPaused()) {
        this.reviewAnimationId = null;
        return;
    }
    const deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    const sliderEl = this.reviewSlider()?.nativeElement;
    if (!sliderEl) return;

    let currentTranslate = this.getTranslateX(sliderEl);
    currentTranslate -= this.SCROLL_SPEED * deltaTime;
    
    const firstChild = sliderEl.firstElementChild as HTMLElement;
    if (firstChild) {
      const itemWidth = firstChild.offsetWidth;
      // Use parseFloat for gap
      const gap = parseFloat(window.getComputedStyle(sliderEl).gap || '0');
      const itemWidthWithGap = itemWidth + gap;
      const totalContentWidth = this.reviews.length * itemWidthWithGap;
      const wrapPoint = -(totalContentWidth + (this.CLONE_COUNT * itemWidthWithGap));
      if (currentTranslate <= wrapPoint) {
        currentTranslate += totalContentWidth;
        this.reviewIndex.update(i => i - this.reviews.length);
      }
    }
    this.renderer.setStyle(sliderEl, 'transform', `translateX(${currentTranslate}px)`);
    this.reviewAnimationId = requestAnimationFrame((t) => this.animateReviewScroll(t));
  }

  public pauseReviewAutoScrollLayer2() {
    this.isReviewSliderLayer2Paused.set(true);
    if (this.reviewAutoScrollTimeoutLayer2) clearTimeout(this.reviewAutoScrollTimeoutLayer2);
  }

  public resumeReviewAutoScrollLayer2(delay: number = 0) {
    if (this.reviewAutoScrollTimeoutLayer2) clearTimeout(this.reviewAutoScrollTimeoutLayer2);
    this.reviewAutoScrollTimeoutLayer2 = setTimeout(() => {
      this.isReviewSliderLayer2Paused.set(false);
      this.lastFrameTimeLayer2 = performance.now();
      if (!this.reviewLayer2AnimationId) {
        this.reviewLayer2AnimationId = requestAnimationFrame((t) => this.animateReviewScrollLayer2(t));
      }
    }, delay);
  }
  
  private animateReviewScrollLayer2(timestamp: number) {
    if (this.isReviewSliderLayer2Paused()) {
        this.reviewLayer2AnimationId = null;
        return;
    }
    const deltaTime = (timestamp - this.lastFrameTimeLayer2) / 1000;
    this.lastFrameTimeLayer2 = timestamp;

    const sliderEl = this.reviewSliderLayer2()?.nativeElement;
    if (!sliderEl) return;
    let currentTranslate = this.getTranslateX(sliderEl);
    currentTranslate += this.SCROLL_SPEED * deltaTime;
    
    const firstChild = sliderEl.firstElementChild as HTMLElement;
    if (firstChild) {
      const itemWidth = firstChild.offsetWidth;
      const gap = parseFloat(window.getComputedStyle(sliderEl).gap || '0');
      const itemWidthWithGap = itemWidth + gap;
      const totalContentWidth = this.reviewsLayer2.length * itemWidthWithGap;
      
      const wrapPoint = 0;
      if (currentTranslate >= wrapPoint) {
        currentTranslate -= totalContentWidth;
        this.reviewLayer2Index.update(i => i + this.reviewsLayer2.length);
      }
    }
    this.renderer.setStyle(sliderEl, 'transform', `translateX(${currentTranslate}px)`);
    this.reviewLayer2AnimationId = requestAnimationFrame((t) => this.animateReviewScrollLayer2(t));
  }

  openProgramPopup(program: ProgramItem) {
    this.selectedProgram.set(program);
    this.programImageIndex.set(0);
    this.popupImageTranslateX.set(0);
    this.isProgramPopupOpen.set(true);
    this.renderer.addClass(document.body, 'overflow-hidden');
  }

  closeProgramPopup() {
    this.isProgramPopupOpen.set(false);
    this.renderer.removeClass(document.body, 'overflow-hidden');
    setTimeout(() => this.selectedProgram.set(null), 300);
  }

  openPopup(contentType: 'terms' | 'privacy') {
    this.popupContent.set(contentType);
    this.isPopupOpen.set(true);
    this.renderer.addClass(document.body, 'overflow-hidden');
  }

  closePopup() {
    this.isPopupOpen.set(false);
    this.renderer.removeClass(document.body, 'overflow-hidden');
    setTimeout(() => this.popupContent.set(null), 300);
  }

  toggleFaq(index: number) {
    this.openFaqIndex.update(current => current === index ? null : index);
  }

  public getMaxIndex(sliderName: 'experience' | 'class' | 'special'): number {
    return this.maxIndices()[sliderName];
  }
  
  public prevExperience() {
    this.experienceIndex.update(i => Math.max(0, i - 1));
    this.updateSliderPosition('experience');
  }
  
  public nextExperience() {
    this.experienceIndex.update(i => Math.min(this.getMaxIndex('experience'), i + 1));
    this.updateSliderPosition('experience');
  }
  
  public prevClass() {
    this.classIndex.update(i => Math.max(0, i - 1));
    this.updateSliderPosition('class');
  }
  
  public nextClass() {
    this.classIndex.update(i => Math.min(this.getMaxIndex('class'), i + 1));
    this.updateSliderPosition('class');
  }
  
  public prevSpecial() {
    this.specialIndex.update(i => Math.max(0, i - 1));
    this.updateSliderPosition('special');
  }
  
  public nextSpecial() {
    this.specialIndex.update(i => Math.min(this.getMaxIndex('special'), i + 1));
    this.updateSliderPosition('special');
  }
  
  public dragStart(event: MouseEvent | TouchEvent, sliderName: string) {
    const state = this.sliderDragState[sliderName];
    if (!state) return;
  
    if (sliderName.startsWith('review')) {
      if (sliderName === 'review') this.pauseReviewAutoScroll();
      else this.pauseReviewAutoScrollLayer2();
      state.minTranslate = undefined;
      state.maxTranslate = undefined;
    }
  
    state.isDragging = true;
    state.isScrolling = undefined;
    state.startX = event.type.startsWith('touch') ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX;
    state.startY = event.type.startsWith('touch') ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY;
    
    const sliderEl = this.getSliderElement(sliderName);
    if (sliderEl) {
      state.startTranslate = this.getTranslateX(sliderEl);
      this.renderer.removeClass(sliderEl, 'slider-transition');

      // Calculate Hard Stop Boundaries only for non-infinite sliders
      if (!sliderName.startsWith('review')) {
          const container = sliderEl.parentElement;
          const firstChild = sliderEl.firstElementChild as HTMLElement;
          if (container && firstChild) {
              const style = window.getComputedStyle(sliderEl);
              const paddingLeft = parseFloat(style.paddingLeft) || 0;
              const paddingRight = parseFloat(style.paddingRight) || 0;
              // Use parseFloat for gap
              const gap = parseFloat(style.gap || '0');
              const childWidth = firstChild.offsetWidth;
              const itemCount = sliderEl.children.length;
              const totalContentWidth = (itemCount * childWidth) + ((itemCount - 1) * gap);
              const containerWidth = container.clientWidth;
              
              // Ensure we scroll enough to show the right padding at the end
              const maxScroll = Math.max(0, totalContentWidth + paddingLeft + paddingRight - containerWidth);
              
              state.minTranslate = -maxScroll;
              state.maxTranslate = 0;
          }
      }
    }
    
    state.currentTranslate = state.startTranslate;
    state.velocityX = 0;
    state.lastX = state.startX;
    state.lastTimestamp = performance.now();
    
    const sliderContainer = sliderEl?.parentElement;
    if (sliderContainer) this.renderer.addClass(sliderContainer, 'dragging');
    
    if (!event.type.startsWith('touch')) {
      event.preventDefault();
    }
  }
  
  public callShop() {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = 'tel:0507-1381-5672';
    }
  }
  
  public prevProgramImage() {
    const maxIndex = (this.selectedProgram()?.images?.length || 1) - 1;
    this.programImageIndex.update(i => (i > 0 ? i - 1 : maxIndex));
    this.updatePopupImageSliderPosition();
  }
  
  public nextProgramImage() {
    const maxIndex = (this.selectedProgram()?.images?.length || 1) - 1;
    this.programImageIndex.update(i => (i < maxIndex ? i + 1 : 0));
    this.updatePopupImageSliderPosition();
  }
  
  public setProgramImage(index: number) {
    this.programImageIndex.set(index);
    this.updatePopupImageSliderPosition();
  }
  
  private updatePopupImageSliderPosition() {
      const sliderEl = this.popupImageSliderContainer()?.nativeElement;
      if (!sliderEl) return;
      const itemWidth = sliderEl.offsetWidth;
      this.popupImageTranslateX.set(-this.programImageIndex() * itemWidth);
      this.popupImageSliderTransition.set(true);
  }
  
  public popupImageDragStart(event: MouseEvent | TouchEvent) {
    if (!event.type.startsWith('touch')) {
      event.preventDefault();
    }
    this.popupImageDragState.isDragging = true;
    this.popupImageDragState.isScrolling = undefined;
    this.popupImageSliderTransition.set(false);
    
    this.popupImageDragState.startX = event.type.startsWith('touch') ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX;
    this.popupImageDragState.startY = event.type.startsWith('touch') ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY;
    this.popupImageDragState.startTranslate = this.popupImageTranslateX();
  }

  public preloadProgramImages(program: ProgramItem): void {
    if (!isPlatformBrowser(this.platformId) || this.preloadedPrograms.has(program.id)) {
      return;
    }

    this.preloadedPrograms.add(program.id);
    const imagesToPreload = program.images?.length ? program.images : [program.image];

    imagesToPreload.forEach(imageUrl => {
      if (imageUrl) {
        this.preloadImage(imageUrl);
      }
    });
  }

  // Helper for program preloading and banner preloading
  private preloadImage(url: string) {
    const img = new Image();
    img.src = url;
  }
}