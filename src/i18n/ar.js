// All user-facing Arabic strings live here so later phases can reuse them
// and so a second language could be added without touching components.

function arabicMoveCount(n) {
  if (n === 1) return 'نقلة واحدة';
  if (n === 2) return 'نقلتان';
  if (n >= 3 && n <= 10) return `${n} نقلات`;
  return `${n} نقلة`;
}

export const ar = {
  appTitle: 'مراجعة مباريات الشطرنج',

  white: 'الأبيض',
  black: 'الأسود',

  nav: {
    first: 'الموضع الابتدائي',
    prev: 'النقلة السابقة',
    next: 'النقلة التالية',
    last: 'آخر نقلة',
    flip: 'قلب اللوحة',
    undo: 'تراجع عن آخر نقلة',
    reset: 'لعبة جديدة',
    groupLabel: 'التنقل بين النقلات',
  },

  modal: { close: 'إغلاق' },

  appBar: {
    import: 'استيراد PGN',
    importTitle: 'استيراد مباراة',
    newGame: 'لعبة جديدة',
    settings: 'الإعدادات',
  },

  tabs: {
    groupLabel: 'أقسام التحليل',
    analysis: 'التحليل',
    moves: 'النقلات',
    review: 'المراجعة',
  },

  importModal: {
    title: 'استيراد مباراة',
    tabs: 'نوع الاستيراد',
    file: 'اختيار ملف PGN',
    fileName: (name) => `الملف: ${name}`,
    fileError: 'تعذّرت قراءة الملف. تأكد أنه ملف نصي بصيغة PGN.',
    submit: 'استيراد',
    cancel: 'إلغاء',
    shortcut: 'اختصار: Ctrl + Enter',
  },

  settings: {
    title: 'الإعدادات',
    done: 'تم',
    boardSection: 'اللوحة',
    theme: 'ألوان اللوحة',
    themes: { ocean: 'محيط', classic: 'كلاسيكي', walnut: 'جوزي', slate: 'رمادي' },
    analysisSection: 'التحليل',
    arrow: 'عرض سهم أفضل نقلة',
    arrowHint:
      'خيار شخصي للعرض فقط. يستمر المحرك بالتحليل وتحديث التقييم سواء عرضت السهم أم لا.',
    auto: 'تشغيل التحليل المباشر تلقائياً',
    autoHint: 'يبدأ المحرك عند فتح التطبيق. عند إيقافه، شغّل المحرك يدوياً من تبويب «التحليل».',
    saved: 'تُحفظ الإعدادات في هذا المتصفح.',
  },

  evalBar: {
    label: 'شريط التقييم',
    loading: 'جارٍ تحميل المحرك…',
    off: 'التحليل المباشر متوقف',
    stale: 'جارٍ تحديث التقييم…',
    pausedByReview: 'التحليل المباشر متوقف مؤقتاً أثناء المراجعة',
  },

  fen: {
    copy: 'نسخ FEN',
    copied: 'تم النسخ',
  },

  confirmTruncate:
    'اللعب من هذا الموضع سيحذف النقلات التالية في المباراة (وأي مراجعة تمت). هل تريد المتابعة؟',

  errorBoundary: {
    title: 'حدث خطأ غير متوقع',
    body: 'تعذّر عرض التطبيق بسبب خطأ. يمكنك إعادة تحميل الصفحة والمحاولة مرة أخرى.',
    reload: 'إعادة تحميل الصفحة',
  },

  confirmReset: 'سيتم مسح اللعبة الحالية والبدء من جديد. هل تريد المتابعة؟',

  moves: {
    title: 'النقلات',
    empty: 'لم تُلعب أي نقلة بعد. حرّك قطعة على اللوحة أو استورد مباراة.',
    placeholderCell: '…',
  },

  promotion: {
    title: 'اختر القطعة للترقية',
    q: 'وزير',
    r: 'قلعة',
    b: 'فيل',
    n: 'حصان',
    cancel: 'إلغاء',
  },

  status: {
    toMove: 'الدور',
    turn: (side) => `الدور على ${side}`,
    check: (side) => `كش! الدور على ${side}`,
    checkmate: (winner) => `كش مات — فاز ${winner}`,
    stalemate: 'تعادل بالجمود (Stalemate)',
    insufficient: 'تعادل — القطع المتبقية غير كافية للتمات',
    fiftyMove: 'تعادل — قاعدة الخمسين نقلة',
    currentFen: 'FEN الحالي',
  },

  import: {
    title: 'استيراد',
    tabPgn: 'PGN',
    tabFen: 'FEN',
    pgnLabel: 'الصق نص مباراة PGN',
    fenLabel: 'الصق نص موضع FEN',
    pgnPlaceholder: '[Event "..."]\n[White "..."]\n[Black "..."]\n\n1. e4 e5 2. Nf3 Nc6 ...',
    fenPlaceholder: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    load: 'تحميل',
    clear: 'مسح',
    loadedPgn: (n) => `تم تحميل المباراة (${arabicMoveCount(n)}).`,
    loadedFen: 'تم تحميل الموضع بنجاح.',
    singleGameHint: 'يُقرأ أول مباراة فقط من نص PGN.',
  },

  errors: {
    empty: 'الرجاء إدخال النص أولاً.',
    invalidFen:
      'صيغة FEN غير صالحة. تأكد من ترتيب الحقول وأن الموضع قانوني (لكل لاعب ملك واحد).',
    invalidPgn: 'تعذّر قراءة نص PGN. تأكد من صحة النقلات ومن سلامة الصيغة.',
    noMoves: 'لم يتم العثور على أي نقلات في نص PGN.',
    tooLarge: 'النص المُدخل كبير جداً (الحد الأقصى 200 ألف حرف).',
    unknown: 'حدث خطأ غير متوقع أثناء التحميل.',
  },

  engine: {
    title: 'تحليل المحرك',
    subtitle: 'Stockfish',
    start: 'تشغيل المحرك',
    stop: 'إيقاف المحرك',
    retry: 'إعادة المحاولة',
    idleHint: 'اضغط «تشغيل المحرك» لتحليل الموضع الحالي. يتم تحميل المحرك عند أول تشغيل فقط.',
    loading: 'جارٍ تحميل المحرك…',
    searching: 'جارٍ التحليل…',
    paused: 'المحرك متوقف',
    pausedByReview: 'متوقف مؤقتاً أثناء مراجعة المباراة، وسيعود تلقائياً بعدها.',
    running: 'يعمل',
    loadingChip: 'يحمّل',
    stoppedChip: 'متوقف',
    waiting: 'بانتظار أول نتيجة…',
    terminal: 'لا توجد نقلات قانونية في هذا الموضع، لذلك لا حاجة للتحليل.',
    depthLabel: 'عمق التحليل',
    linesLabel: 'عدد الأسطر',
    evaluation: 'التقييم',
    bestMove: 'أفضل نقلة',
    lineTitle: 'الأسطر الرئيسية',
    reached: (d, target) => `العمق ${d} من ${target}`,
    speed: (knps) => `${knps} ألف عقدة/ث`,
    whiteAhead: 'الأبيض أفضل',
    blackAhead: 'الأسود أفضل',
    equal: 'متعادل تقريباً',
    errors: {
      engineMissing:
        'تعذّر تحميل ملفات المحرك. تأكد من تنفيذ npm install ثم أعد تشغيل الخادم (npm run dev).',
      unsupported: 'متصفحك لا يدعم WebAssembly أو Web Workers المطلوبة لتشغيل المحرك.',
      timeout: 'استغرق تشغيل المحرك وقتاً أطول من المتوقع. حاول مرة أخرى.',
      crashed: 'توقف المحرك بشكل غير متوقع. حاول تشغيله مرة أخرى.',
      unknown: 'حدث خطأ غير متوقع في المحرك.',
    },
  },

  review: {
    title: 'مراجعة المباراة',
    note: 'يحلّل Stockfish كل نقلات المباراة في الخلفية. تغيير المباراة أثناء المراجعة (نقلة، تراجع، استيراد) يلغيها.',
    noMoves: 'لا توجد نقلات لمراجعتها. استورد مباراة PGN أو العب بعض النقلات أولاً.',
    start: 'بدء مراجعة المباراة',
    rerun: 'إعادة المراجعة',
    running: 'جارٍ المراجعة…',
    cancel: 'إلغاء المراجعة',
    cancelled: 'تم إلغاء المراجعة. يمكنك بدؤها من جديد في أي وقت.',
    cancelledByChange: 'أُلغيت المراجعة لأن المباراة تغيّرت أثناء التحليل. ابدأها من جديد عند الجاهزية.',
    etaSeconds: (s) => `المتبقي تقريباً ${s} ثانية`,
    etaMinutes: (m, s) => `المتبقي تقريباً ${m} د ${s} ث`,
    etaCalculating: 'جارٍ تقدير الوقت المتبقي…',

    startPosition: 'الموضع الابتدائي',
    bestWas: 'الأفضل كانت',
    playedBest: 'هذه هي النقلة الأفضل في الموضع.',
    cpLoss: (n) => `خسارة ${n} سنتي-بيدق`,
    evalAfter: 'التقييم',
    prevMistake: 'الخطأ السابق',
    nextMistake: 'الخطأ التالي',
    noMistakes: 'لا توجد أخطاء أو أخطاء فادحة في هذه المباراة.',
    mistakeNavHint: 'التنقل بين الأخطاء والأخطاء الفادحة فقط.',
    depthLabel: 'دقة المراجعة',
    depthNames: { 10: 'سريعة', 14: 'متوازنة', 18: 'دقيقة' },
    progress: (done, total) => `تحليل الموضع ${done} من ${total}`,
    livePaused: 'تم إيقاف التحليل المباشر أثناء المراجعة لتوفير الأداء.',
    resultsTitle: 'نتائج المراجعة',
    accuracy: 'الدقة',
    avgCpLoss: 'متوسط خسارة السنتي-بيدق',
    moves: 'النقلات',
    classification: 'تصنيف النقلات',
    approx:
      'التصنيف والدقة تقديرات تقريبية مبنية على عمق ثابت، وقد تختلف عن نتائج المواقع الأخرى.',
    classifications: {
      brilliant: 'رائعة',
      great: 'قوية جداً',
      best: 'الأفضل',
      excellent: 'ممتازة',
      good: 'جيدة',
      inaccuracy: 'غير دقيقة',
      mistake: 'خطأ',
      blunder: 'خطأ فادح',
    },
  },

  player: {
    defaultWhite: 'الأبيض',
    defaultBlack: 'الأسود',
  },
};
