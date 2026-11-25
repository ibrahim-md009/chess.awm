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
    unknown: 'حدث خطأ غير متوقع أثناء التحميل.',
  },

  player: {
    defaultWhite: 'الأبيض',
    defaultBlack: 'الأسود',
  },
};
