/**
 * i18n dictionary. Arabic is PRIMARY (RTL). English is the LTR variant.
 * No component should hardcode UI copy — pull from here.
 */

export type Locale = "ar" | "en";

export const dict: Record<Locale, Dict> = {
  ar: {
    dir: "rtl",
    brand: "مَمسَى",
    dashboardTag: "لوحة الشركاء",
    // Nav
    nav: {
      overview: "الرئيسية",
      units: "الوحدات",
      calendar: "التقويم",
      bookings: "الحجوزات",
      reports: "التقارير",
      wallet: "المحفظة",
      account: "الحساب",
      notifications: "الإشعارات",
      logout: "تسجيل خروج",
    },
    // Login
    login: {
      portal: "بوابة الشركاء",
      welcome: "مرحباً بعودتك 👋",
      subtitle: "سجّل الدخول لإدارة وحداتك",
      phoneLabel: "رقم الجوال",
      sendOtp: "أرسل الرمز",
      verifyTitle: "تحقق من رقمك",
      otpSent: "أرسلنا رمزاً مكوّناً من 6 أرقام إلى",
      verify: "تحقق وسجّل الدخول",
      resendIn: (s: number) => `إعادة الإرسال خلال ${s} ثانية`,
      resend: "إعادة إرسال الرمز",
      changeNumber: "تغيير الرقم",
      errWrongNumber: "رقم الجوال غير صحيح.",
      errWrongCode: "الرمز غير صحيح. حاول مرة أخرى.",
      errExpired: "انتهت صلاحية الرمز. أعد الإرسال.",
      errLocked: "تجاوزت عدد المحاولات — اطلب رمزًا جديدًا.",
      errRateLimited: "محاولات كثيرة — انتظر قليلًا ثم أعد المحاولة.",
      errNetwork: "تعذر الوصول إلى الخادم حالياً. جرّب مرة أخرى.",
      pending: "طلبك قيد المراجعة — سنُشعرك عند الاعتماد.",
      suspended: "الحساب موقوف. تواصل مع الدعم.",
      underReviewTitle: "طلبك قيد المراجعة",
      underReviewDesc: "شكراً على انضمامك لـ مَمسَى! طلبك يخضع الآن للمراجعة من قبل فريقنا.",
      underReviewHint: "سنُشعرك عند اعتماد حسابك. يمكنك بعدها تسجيل الدخول مباشرة.",
      suspendedTitle: "الحساب موقوف",
      suspendedDesc: "للأسف، حسابك قد تم إيقافه حالياً. يرجى التواصل مع فريق الدعم للمزيد من المعلومات.",
      tryAgain: "حاول تسجيل الدخول مرة أخرى",
      backToLogin: "العودة إلى تسجيل الدخول",
      heroBadge: "فيلا فاخرة · جدة، السعودية",
      heroTitleLine1: "وحداتك.",
      heroTitleLine2: "لوحة واحدة.",
      heroSubtitle: "تابع الإيرادات، أدر الحجوزات، زامن التقاويم، ونمِّ محفظتك — كل ذلك في مكان واحد.",
      statProperties: "2,400+",
      statPropertiesLabel: "وحدة",
      statPartners: "800+",
      statPartnersLabel: "شريك",
      statRevenue: "SAR 1B+",
      statRevenueLabel: "إيرادات مُدارة",
      privacy: "الخصوصية",
      terms: "الشروط",
    },
    // Overview dashboard
    overview: {
      welcomeBack: "مرحباً بعودتك",
      viewReports: "عرض التقارير",
      pendingActions: "إجراءات معلّقة",
      thisMonth: "هذا الشهر",
      totalProperties: "إجمالي الوحدات",
      propsBreakdown: (a: number, p: number) => `${a} معتمدة · ${p} قيد المراجعة`,
      totalBookings: "إجمالي الحجوزات",
      thisYear: "هذه السنة",
      totalRevenue: "إجمالي الإيرادات",
      occupancyRate: "معدل الإشغال",
      monthlyAverage: "متوسط شهري",
      avgNightlyRate: "متوسط سعر الليلة",
      perProperty: "لكل وحدة",
      guestRating: "تقييم الضيوف",
      acrossAll: "عبر كل الوحدات",
      revenueOverview: "نظرة على الإيرادات",
      monthlyRevenueTrend: "الاتجاه الشهري للإيرادات",
      occupancySplit: "توزيع الإشغال",
      currentMonthAll: "الشهر الحالي · كل الوحدات",
      monthlyBookings: "الحجوزات الشهرية",
      reservationsPerMonth: "الحجوزات لكل شهر",
      topProperties: "أفضل الوحدات",
      byRevenue: "حسب الإيراد · هذه السنة",
      searchPlaceholder: "ابحث عن وحدات، حجوزات…",
      newBtn: "جديد",
      proPartner: "شريك محترف",
      range6m: "6 أشهر",
      range1y: "سنة",
      rangeAll: "الكل",
      rejectedBanner: "لديك وحدة مرفوضة — راجع سبب الرفض.",
    },
    units: {
      totalApproved: (total: number, approved: number) => `${total} وحدة · ${approved} معتمدة`,
      perNight: "لكل ليلة",
      newProperty: "إضافة وحدة",
      deleteTitle: "حذف الوحدة",
      deleteConfirm: (name: string) => `هل أنت متأكد من حذف «${name}»؟ لا يمكن التراجع عن هذا الإجراء.`,
      deleting: "جارٍ الحذف…",
      emptyTitle: "لا توجد وحدات بعد",
      emptyBody: "ابدأ بإضافة أول وحدة لك لعرضها هنا.",
    },
    reports: {
      title: "التقارير والتحليلات",
      subtitle: "رؤى مالية وأداء",
      exportPdf: "تصدير PDF",
      exportCsv: "تصدير CSV",
      grossRevenue: "إجمالي الإيرادات (شامل الضريبة)",
      netRevenue: "الإيراد غير شامل الضريبة",
      vat: "ضريبة القيمة المضافة (15%)",
      fees: "رسوم الخدمة والتنظيف (ملغاة)",
      commission: "عمولة مَمسَى (2%)",
      netProfit: "صافي الربح (بعد العمولة)",
      revenueTrend: "اتجاه الإيرادات",
      monthlyBreakdown: "التفصيل الشهري",
      propertyPerformance: "أداء الوحدات",
      colProperty: "الوحدة",
      colRevenue: "الإيراد",
      colBookings: "الحجوزات",
      colRating: "التقييم",
    },
    calendar: {
      title: "تقويم الإتاحة",
      subtitle: "أدر واحجب التواريخ عبر وحداتك",
      unitLabel: "الوحدة",
      syncIcal: "مزامنة iCal",
      icalSynced: "تمت مزامنة iCal",
      datesSelected: (n: number) => `${n} تواريخ محددة`,
      clear: "مسح",
      block: "حجب",
      makeAvailable: "إتاحة",
      icalIntegrations: "تكاملات iCal",
      lastSync: (v: string) => `آخر مزامنة: ${v}`,
      lastSyncNever: "لم تتم المزامنة بعد",
      synced: "متزامن",
      error: "خطأ",
      syncNow: "مزامنة الآن",
      addFeed: "إضافة تقويم",
      feedSourcePh: "المصدر (مثال: Airbnb)",
      feedUrlPh: "رابط iCal (.ics)",
      add: "إضافة",
      exportTitle: "تصدير تقويم مَمسَى",
      exportSub: "أضف هذا الرابط في المنصات الأخرى ليقفل تواريخ مَمسَى عندهم تلقائيًا.",
      quickBlock: "حجب سريع",
      quickBlockSub: "احجب فترة تواريخ كاملة في الوحدة المختارة",
      blockReasonPh: "السبب (اختياري)",
      blockSelectedDates: "حجب التواريخ المحددة",
      weekdays: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
      noApprovedTitle: "لا توجد وحدات معتمدة بعد",
      noApprovedBody: "يظهر التقويم بعد اعتماد أول وحدة لك. وحداتك قيد المراجعة حاليًا.",
    },
    account: {
      title: "إعدادات الحساب",
      subtitle: "أدر ملفك الشخصي وتفضيلاتك",
      partnerProfile: "بيانات الشريك",
      fullName: "الاسم الكامل",
      emailAddress: "البريد الإلكتروني",
      phoneNumber: "رقم الجوال (يُغيّر عبر OTP)",
      partnerType: "نوع الشريك",
      verificationId: "رقم الهوية / السجل التجاري",
      verificationIdMissing: "غير مسجَّل — تواصل مع الدعم لإضافته",
      location: "الموقع",
      saveChanges: "حفظ التغييرات",
      profileSaved: "تم حفظ البيانات",
      nameRequired: "الاسم مطلوب",
      emailInvalid: "بريد إلكتروني غير صحيح",
      partnerSince: (d: string) => `شريك منذ ${d}`,
      approved: "معتمد",
      companyType: "شركة إدارة عقارات",
      individualType: "مضيف فرد",
      companyDocsTitle: "بيانات استلام المدفوعات",
      companyDocsSubtitle: "مطلوبة مرة واحدة قبل إرسال أول وحدة للمراجعة.",
      companyDocsCompleteBadge: "مكتملة",
      companyDocsIncompleteBadge: "غير مكتملة",
      crLabel: "رقم السجل التجاري",
      ibanLabel: "رقم الآيبان (IBAN)",
      authLetterLabel: "خطاب تفويض الممثل",
      vatCertLabel: "شهادة ضريبة القيمة المضافة",
      operatorLicenseLabel: "رخصة مشغّل الضيافة",
      saveCompanyDocs: "حفظ بيانات الشركة",
      companyDocsSaved: "تم حفظ البيانات",
      crInvalid: "رقم السجل التجاري يجب أن يتكون من 10 أرقام",
      crFileLabel: "صورة السجل التجاري",
      crFileHint: "صورة واضحة (JPG أو PNG) أو ملف PDF — التصوير بالجوال مقبول.",
      crFileMissing: "لم تُرفع صورة السجل التجاري بعد — الرقم وحده لا يمكن للمراجع التحقق منه.",
      crFileOnFile: "صورة السجل التجاري مُسجَّلة على حسابك.",
      crFileView: "عرض الملف المرفوع",
      payoutAccountTitle: "حساب استلام الأرباح",
      payoutAccountSubtitle: "الحساب البنكي الذي تُحوَّل إليه مستحقاتك.",
      accountHolderLabel: "اسم صاحب الحساب",
      savePayoutAccount: "حفظ الحساب البنكي",
      payoutAccountSaved: "تم حفظ الحساب البنكي",
      ibanInvalid: "رقم الآيبان غير صحيح (يبدأ بـ SA ثم 22 رقمًا)",
      identityDocTitle: "صورة الهوية الوطنية",
      identityDocSubtitle: "نسخة واضحة من هويتك، يراجعها فريق مَمسَى للتحقق من حسابك قبل تحويل أرباحك.",
      identityDocFileLabel: "صورة الهوية أو الإقامة",
      identityDocHint: "صورة (JPG أو PNG) أو ملف PDF، بحد أقصى 10 ميجابايت.",
      identityDocNumber: "رقم الهوية المسجَّل",
      identityDocMissing: "لم تُرفع صورة الهوية بعد — لا يمكن توثيق حسابك بدونها.",
      identityDocOnFile: "صورة الهوية مُسجَّلة على حسابك.",
      identityDocSave: "حفظ صورة الهوية",
      identityDocSaved: "تم حفظ صورة الهوية",
      ibanMovedNote: "رقم الآيبان انتقل إلى قسم «بيانات الحساب البنكي» بالأعلى.",
    },
    bank: {
      title: "بيانات الحساب البنكي",
      subtitle: "الحساب الذي تُحوَّل إليه أرباحك.",
      iban: "رقم الآيبان",
      accountHolder: "اسم صاحب الحساب",
      bankName: "اسم البنك",
      bankNamePending: "—",
      verified: "حسابك البنكي موثّق",
      pending: "حسابك البنكي قيد التوثيق من إدارة مَمسَى",
      missing: "أضف حسابك البنكي لاستلام أرباحك",
      rejected: "تم رفض توثيق الحساب",
      rejectedFix: "يرجى تصحيح البيانات وإعادة الإرسال.",
      changeWarning: "تعديل بيانات الحساب — رقم الآيبان أو اسم صاحب الحساب — سيتطلب إعادة توثيقه، ولن تُنفَّذ أي حوالة حتى يتم التوثيق.",
      changeTitle: "تأكيد تعديل الحساب",
      confirmChange: "تأكيد التغيير",
      invalidIban: "رقم الآيبان غير صحيح",
      holderRequired: "اسم صاحب الحساب مطلوب",
      save: "حفظ الحساب البنكي",
      saved: "تم حفظ الحساب البنكي",
      ibanPlaceholder: "SA0000000000000000000000",
    },
    wallet: {
      title: "المحفظة",
      subtitle: "أرباحك وحركات رصيدك.",
      available: "الرصيد المستحق",
      pending: "الرصيد المعلّق",
      lifetimeEarnings: "إجمالي الأرباح",
      lifetimePaidOut: "إجمالي المحوّل",
      ledger: "سجل الحركات",
      balanceAfter: "الرصيد",
      date: "التاريخ",
      type: "النوع",
      description: "الوصف",
      amount: "المبلغ",
      noTransactions: "لا توجد حركات بعد",
      loadMore: "تحميل المزيد",
      cycleNote: "نُحوّل رصيدك المستحق مرة واحدة في شهر ميلادي إذا بلغ 2,000 ر.س أو أكثر.",
      pendingNote: "أرباح حجوزات لم تكتمل بعد — تنتقل للرصيد المستحق بعد انتهاء إقامة الضيف.",
      readyToTransfer: (amount: string) => `رصيدك ${amount} جاهز للتحويل خلال هذا الشهر`,
      paidThisMonth: (date: string) => `تم تحويل مستحقاتك لهذا الشهر بتاريخ ${date}`,
      needMore: (amount: string) => `تحتاج ${amount} إضافية للوصول للحد الأدنى. رصيدك يُرحّل تلقائيًا للشهر التالي.`,
      bankMissing: "أضف حسابك البنكي لاستلام أرباحك",
      bankMissingCta: "إضافة الحساب البنكي",
      bankUnverified: "حسابك البنكي قيد التوثيق. سيتم التحويل بعد اكتمال التوثيق.",
      suspended: "حسابك موقوف حاليًا. تواصل مع الدعم.",
      negativeBalance: "رصيدك الحالي سالب وسيتم تسويته من أرباحك القادمة.",
      progressToMin: (current: string, min: string) => `${current} من ${min}`,
      type_earning: "حصة حجز",
      type_payout: "حوالة صادرة",
      type_refund_reversal: "استرجاع مبلغ مسترد",
      type_adjustment: "تعديل من الإدارة",
      viewPayouts: "عرض الحوالات",
    },
    payouts: {
      title: "الحوالات",
      subtitle: "الحوالات البنكية التي نفّذناها لك.",
      reference: "المرجع",
      period: "الفترة",
      amount: "المبلغ",
      bookingsCount: "عدد الحجوزات",
      status: "الحالة",
      paidAt: "تاريخ التحويل",
      bankReference: "المرجع البنكي",
      bankAccount: "الحساب البنكي",
      statusPaid: "تم التحويل",
      statusReversed: "معكوسة",
      reversalReason: "سبب العكس",
      reversedAt: "تاريخ العكس",
      detailTitle: (ref: string) => `تفاصيل الحوالة ${ref}`,
      includedBookings: "الحجوزات المشمولة",
      colBooking: "الحجز",
      colUnit: "الوحدة",
      colCheckOut: "المغادرة",
      colGross: "الإجمالي",
      colNetBase: "الأساس قبل الضريبة",
      colCommission: "العمولة",
      colShare: "حصتك",
      total: "الإجمالي",
      empty: "لا توجد حوالات بعد",
      emptyBody: "ستظهر هنا كل حوالة نُنفّذها لحسابك البنكي.",
      note: "ملاحظة",
    },
    pricing: {
      priceInclVat: "السعر لليلة (شامل ضريبة القيمة المضافة)",
      priceHelper:
        "هذا هو المبلغ الذي يدفعه الضيف. تُحتسب ضريبة القيمة المضافة (15%) وعمولة المنصة (2%) من هذا المبلغ.",
      guestPays: "الضيف يدفع",
      netEarning: "صافي ربحك",
      netEarningNote: "يُضاف إلى محفظتك بعد انتهاء إقامة الضيف",
      showDeductions: "تفاصيل الخصومات",
      netBase: "الأساس قبل الضريبة",
      vat: "ضريبة القيمة المضافة (15%)",
      commission: "عمولة المنصة (2%)",
      vatTooltip: "تُورَّد كاملةً لهيئة الزكاة والضريبة والجمارك نيابةً عنك",
      commissionTooltip: "مقابل خدمات المنصة والتسويق والدفع الإلكتروني",
      placeholder: "أدخل سعر الليلة لعرض التفاصيل",
    },
    pm: {
      previewTitle: "معاينة الوحدة",
      reviews: (n: number) => `(${n} تقييم)`,
      bedrooms: "غرف النوم",
      beds: "الأسرّة",
      bathrooms: "دورات المياه",
      maxGuests: "أقصى عدد ضيوف",
      nightlyRate: "سعر الليلة",
      occupancyRate: "معدل الإشغال",
      editTitle: "تعديل الوحدة",
      propertyName: "اسم الوحدة",
      location: "الموقع",
      pricePerNight: "سعر الليلة (ر.س)",
      description: "الوصف",
      status: "الحالة",
      saveChanges: "حفظ التغييرات",
      calendarTitle: (name: string) => `التقويم — ${name}`,
      clickDatesHint: "اضغط على التواريخ للتحديد/إلغاء التحديد. يمكن حجب التواريخ المحددة أو إتاحتها.",
      datesSelected: (n: number, list: string) => `${n} تواريخ محددة: ${list}`,
      blockDates: "حجب التواريخ",
      analyticsTitle: (name: string) => `التحليلات — ${name}`,
      shareTitle: "مشاركة الوحدة",
      listingUrl: "رابط الإعلان",
      copy: "نسخ",
    },
    notif: {
      unreadTotal: (unread: number, total: number) => `${unread} غير مقروء · ${total} إجمالي`,
      markAllRead: "تحديد الكل كمقروء",
      cardUnread: "غير مقروء",
      cardBookings: "الحجوزات",
      cardUnits: "الوحدات",
      cardAlerts: "التنبيهات",
      catBooking: "الحجوزات",
      catPayout: "الحوالات",
      catUnits: "الوحدات",
      catAlerts: "التنبيهات",
      groupToday: "اليوم",
      groupYesterday: "أمس",
      groupEarlier: "سابقًا",
      empty: "لا توجد إشعارات",
    },
    bookings: {
      reservationsTotal: (total: number, shown: number) => `${total} حجز · ${shown} معروض`,
      filters: "تصفية",
      property: "الوحدة",
      checkIn: "الوصول",
      checkOut: "المغادرة",
      nights: (n: number) => `${n} ليالٍ`,
      colGuest: "الضيف",
      colBookingId: "رقم الحجز",
      colProperty: "الوحدة",
      colDates: "التواريخ",
      colNights: "الليالي",
      colTotal: "الإجمالي",
      colStatus: "الحالة",
      bookingTitle: (code: string) => `الحجز ${code}`,
      bookingId: "رقم الحجز",
      duration: "المدة",
      total: "الإجمالي",
      yourShare: "حصتك",
      paid: "مدفوع",
      awaitingPayment: "لم يُدفع بعد",
      refunded: "مسترد",
      hostCancellation: "إلغاء مضيف",
      notes: "ملاحظات",
      bookingActions: "إجراءات الحجز",
      unableToHost: "تعذّر استضافة الحجز",
      unableToHostSub: "إلغاء هذا الحجز المؤكد",
      messageGuest: "مراسلة الضيف",
      step1of2: "الخطوة 1 من 2 — سبب الإلغاء",
      step2of2: "الخطوة 2 من 2 — تأكيد الإلغاء",
      selectReason: "اختر سبب تعذّر استضافة هذا الحجز.",
      reasonBookedElsewhere: "الوحدة محجوزة على منصة أخرى",
      reasonUnavailable: "الوحدة غير متاحة",
      reasonMaintenance: "مشكلة صيانة",
      reasonEmergency: "حالة طارئة",
      reasonOther: "أخرى",
      continue: "متابعة",
      confirmCancellation: "تأكيد الإلغاء",
      confirmReviewSub: "يرجى مراجعة العواقب قبل المتابعة.",
      consequenceRefund: "سيحصل الضيف على استرداد كامل فورًا.",
      consequenceRecord: "سيُسجَّل إلغاء مضيف على حسابك.",
      consequenceRanking: "قد ينخفض ترتيب وحدتك في نتائج البحث.",
      consequencePenalty: "قد تؤدي الإلغاءات المتكررة إلى غرامات وفق سياسة المنصة.",
      selectedReason: "السبب المختار",
      financialImpact: "الأثر المالي",
      guestRefundAmount: "المبلغ المسترد للضيف",
      platformCommission: "عمولة المنصة",
      netLoss: "صافي الخسارة",
      cancellingBooking: "جارٍ إلغاء الحجز…",
      pleaseWait: "يرجى الانتظار، لا تغلق هذه النافذة.",
      notifyingGuest: "إشعار الضيف",
      initiatingRefund: "بدء الاسترداد",
      recordingCancellation: "تسجيل الإلغاء",
      cancellationDetails: "تفاصيل الإلغاء",
      cancellationType: "نوع الإلغاء",
      cancellationReason: "سبب الإلغاء",
      cancellationDate: "تاريخ الإلغاء",
      refundAmount: "المبلغ المسترد",
      refundStatusLabel: "حالة الاسترداد",
      processing: "قيد المعالجة",
      completedStatus: "مكتمل",
      timeline: "المسار",
      tlBookingReceived: "تم استلام الحجز",
      tlHostReported: "أبلغ المضيف بتعذّر الاستضافة",
      tlRefundInitiated: "بدأ استرداد الضيف",
      tlRefundCompleted: "اكتمل الاسترداد",
      cancelled: "ملغي",
      emptyTitle: "لا توجد حجوزات بعد",
      emptyBody: "ستظهر الحجوزات هنا فور وصولها.",
    },
    amenity: {
      wifi: "واي فاي",
      ac: "تكييف",
      kitchen: "مطبخ",
      parking: "موقف سيارات",
      pool: "مسبح",
      security: "أمن 24/7",
      self_checkin: "دخول ذاتي",
      family_friendly: "مناسب للعائلات",
    },
    wiz: {
      addNewProperty: "إضافة عقار جديد",
      editProperty: "تعديل العقار",
      approvedEditWarning: "تعديل وحدة معتمدة سيعيدها إلى «قيد المراجعة» وتُخفى من الموقع حتى تُعتمد من جديد.",
      draft: "مسودة",
      stepOf: (n: number, total: number) => `الخطوة ${n} من ${total}`,
      minEstimate: (m: number) => `~${m} دقيقة`,
      steps: ["الترخيص", "البيانات", "الموقع", "الصور", "المراجعة"],
      saveDraft: "حفظ كمسودة",
      completeToContinue: "أكمل الحقول المطلوبة للمتابعة",
      submitForReview: "إرسال للمراجعة",
      saveAsDraft: "حفظ كمسودة",
      clickToUpload: "اضغط للرفع",
      optional: "اختياري",
      // Step 1
      s1Title: "الترخيص والتحقق",
      s1Sub: "تُرفع المستندات مرة واحدة عند إعداد الحساب وليست مطلوبة لكل عقار.",
      accountType: "نوع الحساب",
      individual: "فرد",
      company: "شركة",
      accountTypeFixedNote: "نوع حسابك محدد من ملفك الشخصي ولا يمكن تغييره هنا",
      tourismLicense: "التصريح السياحي",
      tourismLicenseNo: "رقم التصريح السياحي",
      uploadTourismLicense: "رفع التصريح السياحي (PDF)",
      pdfMax10: "ملف PDF · بحد أقصى 10 ميجابايت",
      identityVerification: "التحقق من الهوية",
      nationalId: "رقم الهوية الوطنية / الإقامة",
      verificationIdNote: "مأخوذ من ملفك الشخصي — للتعديل تواصل مع الدعم",
      verificationIdMissing: "لم يُسجَّل رقم الهوية على حسابك",
      verificationIdMissingBody: "تواصل مع الدعم لإضافته. يمكنك متابعة إضافة العقار الآن.",
      companyDetails: "بيانات الشركة",
      companyDocsComplete: "بيانات استلام المدفوعات مكتملة ✓",
      companyDocsIncompleteTitle: "أكمل بيانات الشركة أولاً",
      companyDocsIncompleteBody: "قبل إضافة وحدة، أكمل بيانات استلام المدفوعات (السجل التجاري، الآيبان، والمستندات المطلوبة) من صفحة الحساب.",
      goToAccount: "الذهاب إلى صفحة الحساب",
      // Step 2
      s2Title: "بيانات العقار",
      s2Sub: "أضف المعلومات الأساسية عن عقارك لمساعدة الضيوف على اتخاذ قرارهم.",
      basicInfo: "المعلومات الأساسية",
      propertyName: "اسم العقار",
      propertyNamePh: "مثال: استوديو إطلالة المرسى",
      propertyTypeLabel: "نوع العقار",
      nightPrice: "سعر الليلة (ر.س)",
      bedrooms: "غرف النوم",
      beds: "الأسرّة",
      bathrooms: "دورات المياه",
      guests: "الضيوف",
      city: "المدينة",
      district: "الحي",
      districtPh: "مثال: العليا",
      selectPh: "اختر…",
      description: "الوصف",
      propertyDescription: "وصف العقار",
      descriptionPh: "صف عقارك — موقعه ومميزاته وما يجعله تجربة فريدة…",
      amenities: "المرافق",
      amenitiesSelected: (n: number) => `${n} مرافق مختارة`,
      checkInOut: "الدخول / الخروج",
      checkInTime: "وقت الدخول",
      checkOutTime: "وقت الخروج",
      cancellationPolicy: "سياسة الإلغاء",
      choosePolicy: "اختر سياسة الإلغاء",
      refundLegend: "النِّسب أدناه هي ما يُسترد للضيف حسب موعد إلغائه قبل تاريخ الوصول — الباقي يبقى لك.",
      refundOf: (n: number) => `استرداد ${n}%`,
      noRefund: "بدون استرداد",
      cancellationLockedNote: "بعد تسجيل الوصول، يُقفل الإلغاء تلقائيًا في جميع السياسات.",
      // Step 3
      s3Title: "الموقع",
      s3Sub: "يجب أن يقع عقارك داخل السعودية ليُدرج على المنصة.",
      searchAddress: "البحث عن العنوان",
      fullAddress: "العنوان الكامل للعقار",
      fullAddressPh: "الشارع، الحي، المدينة، المنطقة",
      pinOnMap: "تحديد الموقع على الخريطة",
      enterAddressToPin: "اضغط على الخريطة لتحديد موقع العقار",
      saudiOnly: "داخل السعودية فقط",
      searchPh: "ابحث بالحي أو المدينة — مثال: حي الرابية، الرياض",
      noMatchTitle: "لم نعثر على هذا العنوان",
      noMatchHint:
        "حدّد موقع العقار بالضغط مباشرة على الخريطة بالأسفل. البحث لا يدعم العنوان الوطني المختصر (مثل RUKC8514) ولا أرقام المباني.",
      locationPinned: "تم تحديد الموقع",
      locationConfirmed: "تم تأكيد الموقع",
      saudiArabia: "المملكة العربية السعودية",
      searchBtn: "بحث",
      searching: "جارٍ البحث…",
      noResults: "لا توجد نتائج مطابقة",
      geocodeError: "تعذّر البحث عن العنوان الآن",
      clickMapHint: "اضغط على الخريطة أو اسحب الدبوس لتحديد الموقع بدقة",
      outsideSaudi: "هذا الموقع خارج حدود المملكة العربية السعودية",
      // Step 4
      s4Title: "صور العقار",
      s4Sub: "الصور الاحترافية تزيد معدلات الحجز حتى 40٪. أضف صورة غلاف جذابة.",
      dragPhotos: "اسحب الصور هنا أو اضغط للرفع",
      pngJpgMax: "PNG، JPG · بحد أقصى 10 ميجابايت لكل صورة",
      uploadedCount: (n: number, max: number) => `(${n}/${max} مرفوعة · صورة واحدة على الأقل)`,
      photoRequired: "يجب رفع صورة واحدة على الأقل للمتابعة.",
      photoTip: "نصيحة: الغرف المصوّرة بضوء النهار الطبيعي تحصل على حجوزات أكثر بنسبة 35٪.",
      cover: "الغلاف",
      setCover: "تعيين كغلاف",
      uploading: "جارٍ الرفع…",
      uploadFailed: "تعذّر رفع الملف",
      fileTooLarge: (mb: number) => `حجم الملف أكبر من ${mb} ميجابايت`,
      replaceFile: "استبدال الملف",
      // Step 5
      s5Title: "المراجعة والإرسال",
      s5Sub: "راجع كل التفاصيل قبل إرسال عقارك للمراجعة.",
      licenseNo: "رقم الترخيص",
      uploaded: "تم الرفع",
      name: "الاسم",
      typeLabel: "النوع",
      priceLabel: "السعر",
      sarPerNight: (p: string) => `${p} ر.س / ليلة`,
      capacity: "السعة",
      capacitySummary: (rooms: number, beds: number, baths: number, guests: number) =>
        `${rooms} غرفة · ${beds} سرير · ${baths} دورة مياه · ${guests} ضيوف`,
      amenitiesCount: (n: number) => `${n} مختارة`,
      address: "العنوان",
      coordinates: "الإحداثيات",
      photosUploaded: "الصور المرفوعة",
      photosCount: (n: number) => `${n} صور`,
      coverPhoto: "صورة الغلاف",
      photoN: (n: number) => `صورة ${n}`,
      uploadedPhotos: "الصور المرفوعة",
      allComplete: "جميع الحقول مكتملة — جاهزة للإرسال للمراجعة.",
      submitError: "تعذّر إرسال العقار الآن. حاول مرة أخرى.",
      // Success
      submittedSuccessfully: "تم الإرسال بنجاح!",
      submittedBody: "تم إرسال عقارك للمراجعة. ستصلك رسالة خلال 24–48 ساعة.",
      backToProperties: "العودة إلى العقارات",
    },
    monthsShort: ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"],
    // Statuses
    unitStatus: {
      draft: "مسودة",
      pending: "قيد الموافقة",
      approved: "معتمدة",
      rejected: "مرفوضة",
    },
    bookingStatus: {
      // Matches the server's `status_label` for this state.
      pending_payment: "بانتظار الدفع",
      confirmed: "مؤكد",
      completed: "مكتمل",
      cancelled: "ملغي",
    },
    dayStatus: {
      available: "متاح",
      booked: "محجوز",
      blocked: "مقفول",
      external: "خارجي",
    },
    propertyType: {
      apartment: "شقة",
      studio: "استوديو",
      villa: "فيلا",
    },
    // Common
    common: {
      all: "الكل",
      search: "بحث",
      save: "حفظ التغييرات",
      saveDraft: "حفظ كمسودة",
      submit: "إرسال للمراجعة",
      cancel: "إلغاء",
      close: "إغلاق",
      back: "رجوع",
      next: "التالي",
      edit: "تعديل",
      delete: "حذف",
      view: "عرض",
      loading: "جارٍ التحميل…",
      retry: "إعادة المحاولة",
      copyLink: "نسخ الرابط",
      copied: "تم النسخ",
      required: "مطلوب",
      language: "EN",
    },
    // Empty / error
    states: {
      errorTitle: "حدث خطأ",
      errorBody: "تعذّر تحميل البيانات. حاول مرة أخرى.",
      offline: "لا يوجد اتصال بالإنترنت.",
      notFound: "الصفحة غير موجودة.",
      serverError: "خطأ في الخادم. نعمل على إصلاحه.",
    },
  },
  en: {
    dir: "ltr",
    brand: "Mamsa",
    dashboardTag: "Partner Dashboard",
    nav: {
      overview: "Overview",
      units: "Properties",
      calendar: "Calendar",
      bookings: "Bookings",
      reports: "Reports",
      wallet: "Wallet",
      account: "Account",
      notifications: "Notifications",
      logout: "Sign out",
    },
    login: {
      portal: "Partner Portal",
      welcome: "Welcome back 👋",
      subtitle: "Sign in to manage your units",
      phoneLabel: "Mobile Number",
      sendOtp: "Send OTP",
      verifyTitle: "Verify your number",
      otpSent: "We sent a 6-digit code to",
      verify: "Verify & Sign In",
      resendIn: (s: number) => `Resend in ${s}s`,
      resend: "Resend OTP",
      changeNumber: "Change number",
      errWrongNumber: "That mobile number isn't valid.",
      errWrongCode: "That code isn't right. Try again.",
      errExpired: "The code expired. Resend it.",
      errLocked: "Too many attempts — request a new code.",
      errRateLimited: "Too many requests — wait a moment and try again.",
      errNetwork: "We couldn't reach the server right now. Please try again.",
      pending: "Your account is under review — we'll notify you once approved.",
      suspended: "Account suspended. Contact support.",
      underReviewTitle: "Your account is under review",
      underReviewDesc: "Thank you for joining Mamsa! Your application is currently under review by our team.",
      underReviewHint: "We'll notify you once your account is approved. You can then sign in directly.",
      suspendedTitle: "Account suspended",
      suspendedDesc: "Unfortunately, your account has been suspended. Please contact our support team for more information.",
      tryAgain: "Try signing in again",
      backToLogin: "Back to sign in",
      heroBadge: "Luxury Villa · Jeddah, Saudi Arabia",
      heroTitleLine1: "Your units.",
      heroTitleLine2: "One dashboard.",
      heroSubtitle: "Track revenue, manage bookings, sync calendars, and grow your portfolio — all in one place.",
      statProperties: "2,400+",
      statPropertiesLabel: "Properties",
      statPartners: "800+",
      statPartnersLabel: "Partners",
      statRevenue: "SAR 1B+",
      statRevenueLabel: "Revenue managed",
      privacy: "Privacy",
      terms: "Terms",
    },
    overview: {
      welcomeBack: "Welcome back",
      viewReports: "View Reports",
      pendingActions: "Pending Actions",
      thisMonth: "This Month",
      totalProperties: "Total Properties",
      propsBreakdown: (a: number, p: number) => `${a} approved · ${p} pending`,
      totalBookings: "Total Bookings",
      thisYear: "This year",
      totalRevenue: "Total Revenue",
      occupancyRate: "Occupancy Rate",
      monthlyAverage: "Monthly average",
      avgNightlyRate: "Avg. Nightly Rate",
      perProperty: "Per property",
      guestRating: "Guest Rating",
      acrossAll: "Across all properties",
      revenueOverview: "Revenue Overview",
      monthlyRevenueTrend: "Monthly revenue trend",
      occupancySplit: "Occupancy Split",
      currentMonthAll: "Current month · all properties",
      monthlyBookings: "Monthly Bookings",
      reservationsPerMonth: "Reservations per month",
      topProperties: "Top Properties",
      byRevenue: "By revenue · current year",
      searchPlaceholder: "Search properties, bookings…",
      newBtn: "New",
      proPartner: "Pro Partner",
      range6m: "6M",
      range1y: "1Y",
      rangeAll: "All",
      rejectedBanner: "You have a rejected unit — review the reason.",
    },
    units: {
      totalApproved: (total: number, approved: number) => `${total} total · ${approved} approved`,
      perNight: "per night",
      newProperty: "New Property",
      deleteTitle: "Delete Property",
      deleteConfirm: (name: string) => `Delete "${name}"? This action can't be undone.`,
      deleting: "Deleting…",
      emptyTitle: "No units yet",
      emptyBody: "Add your first unit to see it here.",
    },
    reports: {
      title: "Reports & Analytics",
      subtitle: "Financial and performance insights",
      exportPdf: "Export PDF",
      exportCsv: "Export CSV",
      grossRevenue: "Total Revenue (VAT incl.)",
      netRevenue: "Revenue excl. VAT",
      vat: "VAT (15%)",
      fees: "Service & Cleaning Fees (abolished)",
      commission: "Mamsa Commission (2%)",
      netProfit: "Net Profit (after commission)",
      revenueTrend: "Revenue Trend",
      monthlyBreakdown: "Monthly breakdown",
      propertyPerformance: "Property Performance",
      colProperty: "Property",
      colRevenue: "Revenue",
      colBookings: "Bookings",
      colRating: "Avg. Rating",
    },
    calendar: {
      title: "Availability Calendar",
      subtitle: "Manage and block dates across your properties",
      unitLabel: "Property",
      syncIcal: "Sync iCal",
      icalSynced: "iCal Synced",
      datesSelected: (n: number) => `${n} dates selected`,
      clear: "Clear",
      block: "Block",
      makeAvailable: "Make Available",
      icalIntegrations: "iCal Integrations",
      lastSync: (v: string) => `Last sync: ${v}`,
      lastSyncNever: "Not synced yet",
      synced: "Synced",
      error: "Error",
      syncNow: "Sync now",
      addFeed: "Add feed",
      feedSourcePh: "Source (e.g. Airbnb)",
      feedUrlPh: "iCal URL (.ics)",
      add: "Add",
      exportTitle: "Export Mamsa Calendar",
      exportSub: "Paste this link into other platforms so Mamsa dates auto-block there.",
      quickBlock: "Quick Block",
      quickBlockSub: "Block a whole date range on the selected property",
      blockReasonPh: "Reason (optional)",
      blockSelectedDates: "Block Selected Dates",
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      noApprovedTitle: "No approved units yet",
      noApprovedBody: "The calendar appears once your first unit is approved. Your units are currently under review.",
    },
    account: {
      title: "Account Settings",
      subtitle: "Manage your partner profile and preferences",
      partnerProfile: "Partner Profile",
      fullName: "Full Name",
      emailAddress: "Email Address",
      phoneNumber: "Phone Number (changed via OTP)",
      partnerType: "Partner Type",
      verificationId: "National ID / CR Number",
      verificationIdMissing: "Not on file — contact support to add it",
      location: "Location",
      saveChanges: "Save Changes",
      profileSaved: "Changes saved",
      nameRequired: "Name is required",
      emailInvalid: "Invalid email address",
      partnerSince: (d: string) => `Partner since ${d}`,
      approved: "Approved",
      companyType: "Property Management Company",
      individualType: "Individual Host",
      companyDocsTitle: "Payout Details",
      companyDocsSubtitle: "Required once before your first property can be submitted for review.",
      companyDocsCompleteBadge: "Complete",
      companyDocsIncompleteBadge: "Incomplete",
      crLabel: "Commercial Registration No.",
      ibanLabel: "IBAN",
      authLetterLabel: "Representative Authorization Letter",
      vatCertLabel: "VAT Registration Certificate",
      operatorLicenseLabel: "Hospitality Operator License",
      saveCompanyDocs: "Save Company Details",
      companyDocsSaved: "Details saved",
      crInvalid: "Commercial Registration must be 10 digits",
      crFileLabel: "Commercial Registration scan",
      crFileHint: "A clear image (JPG or PNG) or a PDF — a phone photo is fine.",
      crFileMissing: "No CR scan uploaded yet — a reviewer cannot check the number on its own.",
      crFileOnFile: "Your CR scan is on file.",
      crFileView: "View uploaded file",
      payoutAccountTitle: "Payout Account",
      payoutAccountSubtitle: "The bank account your earnings are transferred to.",
      accountHolderLabel: "Account Holder Name",
      savePayoutAccount: "Save Bank Account",
      payoutAccountSaved: "Bank account saved",
      ibanInvalid: "Invalid IBAN (must start with SA, then 22 digits)",
      identityDocTitle: "National ID Scan",
      identityDocSubtitle: "A clear copy of your ID. Mamsa's team reviews it to verify your account before transferring your earnings.",
      identityDocFileLabel: "National ID or Iqama scan",
      identityDocHint: "An image (JPG or PNG) or a PDF, up to 10 MB.",
      identityDocNumber: "ID number on file",
      identityDocMissing: "No ID scan uploaded yet — your account cannot be verified without it.",
      identityDocOnFile: "Your ID scan is on file.",
      identityDocSave: "Save ID scan",
      identityDocSaved: "ID scan saved",
      ibanMovedNote: "The IBAN has moved to the “Bank Account Details” section above.",
    },
    bank: {
      title: "Bank Account Details",
      subtitle: "The account your earnings are transferred to.",
      iban: "IBAN",
      accountHolder: "Account Holder Name",
      bankName: "Bank Name",
      bankNamePending: "—",
      verified: "Your bank account is verified",
      pending: "Your bank account is being verified by Mamsa",
      missing: "Add your bank account to receive your earnings",
      rejected: "Bank account verification was rejected",
      rejectedFix: "Please correct the details and resubmit.",
      changeWarning: "Editing the account details — the IBAN or the account holder name — will require it to be verified again, and no transfer will be executed until it is.",
      changeTitle: "Confirm Account Change",
      confirmChange: "Confirm Change",
      invalidIban: "Invalid IBAN",
      holderRequired: "Account holder name is required",
      save: "Save Bank Account",
      saved: "Bank account saved",
      ibanPlaceholder: "SA0000000000000000000000",
    },
    wallet: {
      title: "Wallet",
      subtitle: "Your earnings and balance activity.",
      available: "Available Balance",
      pending: "Pending Balance",
      lifetimeEarnings: "Lifetime Earnings",
      lifetimePaidOut: "Lifetime Paid Out",
      ledger: "Transaction History",
      balanceAfter: "Balance",
      date: "Date",
      type: "Type",
      description: "Description",
      amount: "Amount",
      noTransactions: "No transactions yet",
      loadMore: "Load more",
      cycleNote: "We transfer your available balance once per Gregorian month if it reaches SAR 2,000 or more.",
      pendingNote: "Earnings from bookings that haven't completed yet — they move to your available balance once the guest's stay ends.",
      readyToTransfer: (amount: string) => `Your balance of ${amount} is ready to transfer this month`,
      paidThisMonth: (date: string) => `Your earnings for this month were transferred on ${date}`,
      needMore: (amount: string) => `You need ${amount} more to reach the minimum. Your balance carries over automatically to next month.`,
      bankMissing: "Add your bank account to receive your earnings",
      bankMissingCta: "Add bank account",
      bankUnverified: "Your bank account is being verified. Transfers begin once verification completes.",
      suspended: "Your account is currently suspended. Please contact support.",
      negativeBalance: "Your balance is currently negative and will be settled from your upcoming earnings.",
      progressToMin: (current: string, min: string) => `${current} of ${min}`,
      type_earning: "Booking share",
      type_payout: "Outgoing transfer",
      type_refund_reversal: "Refund reversal",
      type_adjustment: "Admin adjustment",
      viewPayouts: "View payouts",
    },
    payouts: {
      title: "Payouts",
      subtitle: "The bank transfers we've executed for you.",
      reference: "Reference",
      period: "Period",
      amount: "Amount",
      bookingsCount: "Bookings",
      status: "Status",
      paidAt: "Transfer Date",
      bankReference: "Bank Reference",
      bankAccount: "Bank Account",
      statusPaid: "Transferred",
      statusReversed: "Reversed",
      reversalReason: "Reversal reason",
      reversedAt: "Reversed on",
      detailTitle: (ref: string) => `Payout ${ref}`,
      includedBookings: "Bookings included",
      colBooking: "Booking",
      colUnit: "Property",
      colCheckOut: "Check-out",
      colGross: "Gross",
      colNetBase: "Base excl. VAT",
      colCommission: "Commission",
      colShare: "Your share",
      total: "Total",
      empty: "No payouts yet",
      emptyBody: "Every transfer we execute to your bank account will appear here.",
      note: "Note",
    },
    pricing: {
      priceInclVat: "Price per night (VAT inclusive)",
      priceHelper:
        "This is the amount the guest pays. VAT (15%) and the platform commission (2%) are calculated from this amount.",
      guestPays: "Guest pays",
      netEarning: "You earn",
      netEarningNote: "Added to your wallet once the guest's stay ends",
      showDeductions: "Deduction details",
      netBase: "Base excl. VAT",
      vat: "VAT (15%)",
      commission: "Platform commission (2%)",
      vatTooltip: "Remitted in full to ZATCA on your behalf",
      commissionTooltip: "For platform services, marketing and online payments",
      placeholder: "Enter a nightly price to see the breakdown",
    },
    pm: {
      previewTitle: "Property Preview",
      reviews: (n: number) => `(${n} reviews)`,
      bedrooms: "Bedrooms",
      beds: "Beds",
      bathrooms: "Bathrooms",
      maxGuests: "Max Guests",
      nightlyRate: "Nightly Rate",
      occupancyRate: "Occupancy Rate",
      editTitle: "Edit Property",
      propertyName: "Property Name",
      location: "Location",
      pricePerNight: "Price Per Night (SAR)",
      description: "Description",
      status: "Status",
      saveChanges: "Save Changes",
      calendarTitle: (name: string) => `Calendar — ${name}`,
      clickDatesHint: "Click dates to select/deselect. Selected dates can be blocked or made available.",
      datesSelected: (n: number, list: string) => `${n} dates selected: ${list}`,
      blockDates: "Block Dates",
      analyticsTitle: (name: string) => `Analytics — ${name}`,
      shareTitle: "Share Property",
      listingUrl: "Listing URL",
      copy: "Copy",
    },
    notif: {
      unreadTotal: (unread: number, total: number) => `${unread} unread · ${total} total`,
      markAllRead: "Mark all read",
      cardUnread: "Unread",
      cardBookings: "Bookings",
      cardUnits: "Units",
      cardAlerts: "Alerts",
      catBooking: "Bookings",
      catPayout: "Payouts",
      catUnits: "Units",
      catAlerts: "Alerts",
      groupToday: "Today",
      groupYesterday: "Yesterday",
      groupEarlier: "Earlier",
      empty: "No notifications",
    },
    bookings: {
      reservationsTotal: (total: number, shown: number) => `${total} reservations total · ${shown} shown`,
      filters: "Filters",
      property: "Property",
      checkIn: "Check-in",
      checkOut: "Check-out",
      nights: (n: number) => `${n} nights`,
      colGuest: "Guest",
      colBookingId: "Booking ID",
      colProperty: "Property",
      colDates: "Dates",
      colNights: "Nights",
      colTotal: "Total",
      colStatus: "Status",
      bookingTitle: (code: string) => `Booking ${code}`,
      bookingId: "Booking ID",
      duration: "Duration",
      total: "Total",
      yourShare: "Your share",
      paid: "Paid",
      awaitingPayment: "Not paid yet",
      refunded: "Refunded",
      hostCancellation: "Host Cancellation",
      notes: "Notes",
      bookingActions: "Booking Actions",
      unableToHost: "Unable to Host Booking",
      unableToHostSub: "Cancel this confirmed booking",
      messageGuest: "Message Guest",
      step1of2: "Step 1 of 2 — Cancellation Reason",
      step2of2: "Step 2 of 2 — Confirm Cancellation",
      selectReason: "Please select the reason you are unable to host this booking.",
      reasonBookedElsewhere: "Property already booked on another platform",
      reasonUnavailable: "Property is unavailable",
      reasonMaintenance: "Maintenance issue",
      reasonEmergency: "Emergency situation",
      reasonOther: "Other",
      continue: "Continue",
      confirmCancellation: "Confirm Cancellation",
      confirmReviewSub: "Please review the consequences before proceeding.",
      consequenceRefund: "The guest will immediately receive a full refund.",
      consequenceRecord: "A Host Cancellation will be recorded on your account.",
      consequenceRanking: "Your property ranking may decrease in search results.",
      consequencePenalty: "Repeated cancellations may result in penalties according to platform policy.",
      selectedReason: "Selected reason",
      financialImpact: "Financial Impact",
      guestRefundAmount: "Guest refund amount",
      platformCommission: "Platform commission",
      netLoss: "Net loss",
      cancellingBooking: "Cancelling booking…",
      pleaseWait: "Please wait, do not close this window.",
      notifyingGuest: "Notifying guest",
      initiatingRefund: "Initiating refund",
      recordingCancellation: "Recording cancellation",
      cancellationDetails: "Cancellation Details",
      cancellationType: "Cancellation type",
      cancellationReason: "Cancellation reason",
      cancellationDate: "Cancellation date",
      refundAmount: "Refund amount",
      refundStatusLabel: "Refund status",
      processing: "Processing",
      completedStatus: "Completed",
      timeline: "Timeline",
      tlBookingReceived: "Booking received",
      tlHostReported: "Host reported unable to host",
      tlRefundInitiated: "Guest refund initiated",
      tlRefundCompleted: "Refund completed",
      cancelled: "Cancelled",
      emptyTitle: "No bookings yet",
      emptyBody: "Bookings will show up here as soon as they arrive.",
    },
    amenity: {
      wifi: "Wi-Fi",
      ac: "A/C",
      kitchen: "Kitchen",
      parking: "Parking",
      pool: "Pool",
      security: "24/7 Security",
      self_checkin: "Self Check-in",
      family_friendly: "Family Friendly",
    },
    wiz: {
      addNewProperty: "Add New Property",
      editProperty: "Edit Property",
      approvedEditWarning: "Editing an approved property returns it to Pending review and hides it from the site until re-approved.",
      draft: "Draft",
      stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
      minEstimate: (m: number) => `~${m} min`,
      steps: ["License", "Details", "Location", "Photos", "Review"],
      saveDraft: "Save Draft",
      completeToContinue: "Complete required fields to continue",
      submitForReview: "Submit for Review",
      saveAsDraft: "Save as Draft",
      clickToUpload: "Click to upload",
      optional: "Optional",
      // Step 1
      s1Title: "License & Verification",
      s1Sub: "Documents are uploaded once during account setup and are not required for every property.",
      accountType: "Account Type",
      individual: "Individual",
      company: "Company",
      accountTypeFixedNote: "Your account type is set on your profile and can't be changed here",
      tourismLicense: "Tourism License",
      tourismLicenseNo: "Tourism License Number",
      uploadTourismLicense: "Upload Tourism License (PDF)",
      pdfMax10: "PDF file · max 10 MB",
      identityVerification: "Identity Verification",
      nationalId: "National ID / Iqama Number",
      verificationIdNote: "Taken from your profile — contact support to change it",
      verificationIdMissing: "No National ID on file",
      verificationIdMissingBody: "Contact support to add it. You can continue adding your property now.",
      companyDetails: "Company Details",
      companyDocsComplete: "Payout details complete ✓",
      companyDocsIncompleteTitle: "Complete your company details first",
      companyDocsIncompleteBody: "Before adding a property, complete your payout details (CR, IBAN, and required documents) on the Account page.",
      goToAccount: "Go to Account",
      // Step 2
      s2Title: "Property Details",
      s2Sub: "Add the key information about your property to help guests make their decision.",
      basicInfo: "Basic Information",
      propertyName: "Property Name",
      propertyNamePh: "e.g. Marina View Studio",
      propertyTypeLabel: "Property Type",
      nightPrice: "Night Price (SAR)",
      bedrooms: "Bedrooms",
      beds: "Beds",
      bathrooms: "Bathrooms",
      guests: "Guests",
      city: "City",
      district: "District / Neighbourhood",
      districtPh: "e.g. Al Olaya",
      selectPh: "Select…",
      description: "Description",
      propertyDescription: "Property Description",
      descriptionPh: "Describe your property — its location, features, and what makes it a unique experience...",
      amenities: "Amenities",
      amenitiesSelected: (n: number) => `${n} amenities selected`,
      checkInOut: "Check-in / Check-out",
      checkInTime: "Check-in Time",
      checkOutTime: "Check-out Time",
      cancellationPolicy: "Cancellation Policy",
      choosePolicy: "Choose a cancellation policy",
      refundLegend: "The percentages below are what the guest gets back depending on when they cancel before check-in — you keep the rest.",
      refundOf: (n: number) => `${n}% refund`,
      noRefund: "No refund",
      cancellationLockedNote: "Cancellation locks automatically after check-in, across all presets.",
      // Step 3
      s3Title: "Location",
      s3Sub: "Your property must be located within Saudi Arabia to be listed on the platform.",
      searchAddress: "Search Address",
      fullAddress: "Full Property Address",
      fullAddressPh: "Street, district, city, region",
      pinOnMap: "Pin location on map",
      enterAddressToPin: "Click the map to pin your property",
      saudiOnly: "Saudi Arabia only",
      searchPh: "Search by district or city — e.g. Al Rabiah, Riyadh",
      noMatchTitle: "We couldn't find that address",
      noMatchHint:
        "Pin your property by clicking directly on the map below. The search doesn't support National Address short codes (like RUKC8514) or building numbers.",
      locationPinned: "Location pinned",
      locationConfirmed: "Location confirmed",
      saudiArabia: "Saudi Arabia",
      searchBtn: "Search",
      searching: "Searching…",
      noResults: "No matching results",
      geocodeError: "Couldn't search for the address right now",
      clickMapHint: "Click the map or drag the pin to fine-tune the location",
      outsideSaudi: "This location is outside Saudi Arabia",
      // Step 4
      s4Title: "Property Photos",
      s4Sub: "Professional photos increase booking rates by up to 40%. Add an eye-catching cover image.",
      dragPhotos: "Drag photos here or click to upload",
      pngJpgMax: "PNG, JPG · max 10 MB each",
      uploadedCount: (n: number, max: number) => `(${n}/${max} uploaded · at least 1 required)`,
      photoRequired: "At least one photo is required to continue.",
      photoTip: "Tip: Rooms photographed in natural daylight receive 35% more bookings.",
      cover: "Cover",
      setCover: "Set as cover",
      uploading: "Uploading…",
      uploadFailed: "Couldn't upload the file",
      fileTooLarge: (mb: number) => `File is larger than ${mb} MB`,
      replaceFile: "Replace file",
      // Step 5
      s5Title: "Review & Submit",
      s5Sub: "Check all details before submitting your property for review.",
      licenseNo: "License No.",
      uploaded: "Uploaded",
      name: "Name",
      typeLabel: "Type",
      priceLabel: "Price",
      sarPerNight: (p: string) => `${p} SAR / night`,
      capacity: "Capacity",
      capacitySummary: (rooms: number, beds: number, baths: number, guests: number) =>
        `${rooms} bedrooms · ${beds} beds · ${baths} baths · ${guests} guests`,
      amenitiesCount: (n: number) => `${n} selected`,
      address: "Address",
      coordinates: "Coordinates",
      photosUploaded: "Photos uploaded",
      photosCount: (n: number) => `${n} photos`,
      coverPhoto: "Cover photo",
      photoN: (n: number) => `Photo ${n}`,
      uploadedPhotos: "Uploaded Photos",
      allComplete: "All fields complete — ready to submit for review.",
      submitError: "Couldn't submit the property right now. Please try again.",
      // Success
      submittedSuccessfully: "Submitted Successfully!",
      submittedBody: "Your property has been sent for review. You will receive a notification within 24–48 hours.",
      backToProperties: "Back to Properties",
    },
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    unitStatus: {
      draft: "Draft",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
    },
    bookingStatus: {
      pending_payment: "Awaiting Payment",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    dayStatus: {
      available: "Available",
      booked: "Booked",
      blocked: "Blocked",
      external: "External",
    },
    propertyType: {
      apartment: "Apartment",
      studio: "Studio",
      villa: "Villa",
    },
    common: {
      all: "All",
      search: "Search",
      save: "Save changes",
      saveDraft: "Save draft",
      submit: "Submit for review",
      cancel: "Cancel",
      close: "Close",
      back: "Back",
      next: "Next",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      loading: "Loading…",
      retry: "Try again",
      copyLink: "Copy link",
      copied: "Copied",
      required: "Required",
      language: "عربي",
    },
    states: {
      errorTitle: "Something went wrong",
      errorBody: "We couldn't load this. Try again.",
      offline: "You're offline.",
      notFound: "Page not found.",
      serverError: "Server error. We're on it.",
    },
  },
} as const;

export type Dict = {
  dir: "rtl" | "ltr";
  brand: string;
  dashboardTag: string;
  nav: Record<
    "overview" | "units" | "calendar" | "bookings" | "reports" | "wallet" | "account" | "notifications" | "logout",
    string
  >;
  login: {
    portal: string;
    welcome: string;
    subtitle: string;
    phoneLabel: string;
    sendOtp: string;
    verifyTitle: string;
    otpSent: string;
    verify: string;
    resendIn: (s: number) => string;
    resend: string;
    changeNumber: string;
    errWrongNumber: string;
    errWrongCode: string;
    errExpired: string;
    errLocked: string;
    errRateLimited: string;
    errNetwork: string;
    pending: string;
    suspended: string;
    underReviewTitle: string;
    underReviewDesc: string;
    underReviewHint: string;
    suspendedTitle: string;
    suspendedDesc: string;
    tryAgain: string;
    backToLogin: string;
    heroBadge: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroSubtitle: string;
    statProperties: string;
    statPropertiesLabel: string;
    statPartners: string;
    statPartnersLabel: string;
    statRevenue: string;
    statRevenueLabel: string;
    privacy: string;
    terms: string;
  };
  overview: {
    welcomeBack: string;
    viewReports: string;
    pendingActions: string;
    thisMonth: string;
    totalProperties: string;
    propsBreakdown: (approved: number, pending: number) => string;
    totalBookings: string;
    thisYear: string;
    totalRevenue: string;
    occupancyRate: string;
    monthlyAverage: string;
    avgNightlyRate: string;
    perProperty: string;
    guestRating: string;
    acrossAll: string;
    revenueOverview: string;
    monthlyRevenueTrend: string;
    occupancySplit: string;
    currentMonthAll: string;
    monthlyBookings: string;
    reservationsPerMonth: string;
    topProperties: string;
    byRevenue: string;
    searchPlaceholder: string;
    newBtn: string;
    proPartner: string;
    range6m: string;
    range1y: string;
    rangeAll: string;
    rejectedBanner: string;
  };
  units: {
    totalApproved: (total: number, approved: number) => string;
    perNight: string;
    newProperty: string;
    deleteTitle: string;
    deleteConfirm: (name: string) => string;
    deleting: string;
    emptyTitle: string;
    emptyBody: string;
  };
  reports: {
    title: string;
    subtitle: string;
    exportPdf: string;
    exportCsv: string;
    grossRevenue: string;
    netRevenue: string;
    vat: string;
    fees: string;
    commission: string;
    netProfit: string;
    revenueTrend: string;
    monthlyBreakdown: string;
    propertyPerformance: string;
    colProperty: string;
    colRevenue: string;
    colBookings: string;
    colRating: string;
  };
  calendar: {
    title: string;
    subtitle: string;
    unitLabel: string;
    syncIcal: string;
    icalSynced: string;
    datesSelected: (n: number) => string;
    clear: string;
    block: string;
    makeAvailable: string;
    icalIntegrations: string;
    lastSync: (v: string) => string;
    lastSyncNever: string;
    synced: string;
    error: string;
    syncNow: string;
    addFeed: string;
    feedSourcePh: string;
    feedUrlPh: string;
    add: string;
    exportTitle: string;
    exportSub: string;
    quickBlock: string;
    quickBlockSub: string;
    blockReasonPh: string;
    blockSelectedDates: string;
    weekdays: string[];
    noApprovedTitle: string;
    noApprovedBody: string;
  };
  account: {
    title: string;
    subtitle: string;
    partnerProfile: string;
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
    partnerType: string;
    verificationId: string;
    verificationIdMissing: string;
    location: string;
    saveChanges: string;
    profileSaved: string;
    nameRequired: string;
    emailInvalid: string;
    partnerSince: (d: string) => string;
    approved: string;
    companyType: string;
    individualType: string;
    companyDocsTitle: string;
    companyDocsSubtitle: string;
    companyDocsCompleteBadge: string;
    companyDocsIncompleteBadge: string;
    crLabel: string;
    ibanLabel: string;
    authLetterLabel: string;
    vatCertLabel: string;
    operatorLicenseLabel: string;
    saveCompanyDocs: string;
    companyDocsSaved: string;
    crInvalid: string;
    crFileLabel: string;
    crFileHint: string;
    crFileMissing: string;
    crFileOnFile: string;
    crFileView: string;
    payoutAccountTitle: string;
    payoutAccountSubtitle: string;
    accountHolderLabel: string;
    savePayoutAccount: string;
    payoutAccountSaved: string;
    ibanInvalid: string;
    identityDocTitle: string;
    identityDocSubtitle: string;
    identityDocFileLabel: string;
    identityDocHint: string;
    identityDocNumber: string;
    identityDocMissing: string;
    identityDocOnFile: string;
    identityDocSave: string;
    identityDocSaved: string;
    ibanMovedNote: string;
  };
  bank: {
    title: string;
    subtitle: string;
    iban: string;
    accountHolder: string;
    bankName: string;
    bankNamePending: string;
    verified: string;
    pending: string;
    missing: string;
    rejected: string;
    rejectedFix: string;
    changeWarning: string;
    changeTitle: string;
    confirmChange: string;
    invalidIban: string;
    holderRequired: string;
    save: string;
    saved: string;
    ibanPlaceholder: string;
  };
  wallet: {
    title: string;
    subtitle: string;
    available: string;
    pending: string;
    lifetimeEarnings: string;
    lifetimePaidOut: string;
    ledger: string;
    balanceAfter: string;
    date: string;
    type: string;
    description: string;
    amount: string;
    noTransactions: string;
    loadMore: string;
    cycleNote: string;
    pendingNote: string;
    readyToTransfer: (amount: string) => string;
    paidThisMonth: (date: string) => string;
    needMore: (amount: string) => string;
    bankMissing: string;
    bankMissingCta: string;
    bankUnverified: string;
    suspended: string;
    negativeBalance: string;
    progressToMin: (current: string, min: string) => string;
    type_earning: string;
    type_payout: string;
    type_refund_reversal: string;
    type_adjustment: string;
    viewPayouts: string;
  };
  payouts: {
    title: string;
    subtitle: string;
    reference: string;
    period: string;
    amount: string;
    bookingsCount: string;
    status: string;
    paidAt: string;
    bankReference: string;
    bankAccount: string;
    statusPaid: string;
    statusReversed: string;
    reversalReason: string;
    reversedAt: string;
    detailTitle: (ref: string) => string;
    includedBookings: string;
    colBooking: string;
    colUnit: string;
    colCheckOut: string;
    colGross: string;
    colNetBase: string;
    colCommission: string;
    colShare: string;
    total: string;
    empty: string;
    emptyBody: string;
    note: string;
  };
  pricing: {
    priceInclVat: string;
    priceHelper: string;
    guestPays: string;
    netEarning: string;
    netEarningNote: string;
    showDeductions: string;
    netBase: string;
    vat: string;
    commission: string;
    vatTooltip: string;
    commissionTooltip: string;
    placeholder: string;
  };
  pm: {
    previewTitle: string;
    reviews: (n: number) => string;
    bedrooms: string;
    beds: string;
    bathrooms: string;
    maxGuests: string;
    nightlyRate: string;
    occupancyRate: string;
    editTitle: string;
    propertyName: string;
    location: string;
    pricePerNight: string;
    description: string;
    status: string;
    saveChanges: string;
    calendarTitle: (name: string) => string;
    clickDatesHint: string;
    datesSelected: (n: number, list: string) => string;
    blockDates: string;
    analyticsTitle: (name: string) => string;
    shareTitle: string;
    listingUrl: string;
    copy: string;
  };
  notif: {
    unreadTotal: (unread: number, total: number) => string;
    markAllRead: string;
    cardUnread: string;
    cardBookings: string;
    cardUnits: string;
    cardAlerts: string;
    catBooking: string;
    catPayout: string;
    catUnits: string;
    catAlerts: string;
    groupToday: string;
    groupYesterday: string;
    groupEarlier: string;
    empty: string;
  };
  bookings: {
    reservationsTotal: (total: number, shown: number) => string;
    filters: string;
    property: string;
    checkIn: string;
    checkOut: string;
    nights: (n: number) => string;
    colGuest: string;
    colBookingId: string;
    colProperty: string;
    colDates: string;
    colNights: string;
    colTotal: string;
    colStatus: string;
    bookingTitle: (code: string) => string;
    bookingId: string;
    duration: string;
    total: string;
    yourShare: string;
    paid: string;
    awaitingPayment: string;
    refunded: string;
    hostCancellation: string;
    notes: string;
    bookingActions: string;
    unableToHost: string;
    unableToHostSub: string;
    messageGuest: string;
    step1of2: string;
    step2of2: string;
    selectReason: string;
    reasonBookedElsewhere: string;
    reasonUnavailable: string;
    reasonMaintenance: string;
    reasonEmergency: string;
    reasonOther: string;
    continue: string;
    confirmCancellation: string;
    confirmReviewSub: string;
    consequenceRefund: string;
    consequenceRecord: string;
    consequenceRanking: string;
    consequencePenalty: string;
    selectedReason: string;
    financialImpact: string;
    guestRefundAmount: string;
    platformCommission: string;
    netLoss: string;
    cancellingBooking: string;
    pleaseWait: string;
    notifyingGuest: string;
    initiatingRefund: string;
    recordingCancellation: string;
    cancellationDetails: string;
    cancellationType: string;
    cancellationReason: string;
    cancellationDate: string;
    refundAmount: string;
    refundStatusLabel: string;
    processing: string;
    completedStatus: string;
    timeline: string;
    tlBookingReceived: string;
    tlHostReported: string;
    tlRefundInitiated: string;
    tlRefundCompleted: string;
    cancelled: string;
    emptyTitle: string;
    emptyBody: string;
  };
  amenity: Record<
    "wifi" | "ac" | "kitchen" | "parking" | "pool" | "security" | "self_checkin" | "family_friendly",
    string
  >;
  wiz: {
    addNewProperty: string;
    editProperty: string;
    approvedEditWarning: string;
    draft: string;
    stepOf: (n: number, total: number) => string;
    minEstimate: (m: number) => string;
    steps: string[];
    saveDraft: string;
    completeToContinue: string;
    submitForReview: string;
    saveAsDraft: string;
    clickToUpload: string;
    optional: string;
    s1Title: string;
    s1Sub: string;
    accountType: string;
    individual: string;
    company: string;
    accountTypeFixedNote: string;
    tourismLicense: string;
    tourismLicenseNo: string;
    uploadTourismLicense: string;
    pdfMax10: string;
    identityVerification: string;
    nationalId: string;
    verificationIdNote: string;
    verificationIdMissing: string;
    verificationIdMissingBody: string;
    companyDetails: string;
    companyDocsComplete: string;
    companyDocsIncompleteTitle: string;
    companyDocsIncompleteBody: string;
    goToAccount: string;
    s2Title: string;
    s2Sub: string;
    basicInfo: string;
    propertyName: string;
    propertyNamePh: string;
    propertyTypeLabel: string;
    nightPrice: string;
    bedrooms: string;
    beds: string;
    bathrooms: string;
    guests: string;
    city: string;
    district: string;
    districtPh: string;
    selectPh: string;
    description: string;
    propertyDescription: string;
    descriptionPh: string;
    amenities: string;
    amenitiesSelected: (n: number) => string;
    checkInOut: string;
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    choosePolicy: string;
    refundLegend: string;
    refundOf: (n: number) => string;
    noRefund: string;
    cancellationLockedNote: string;
    s3Title: string;
    s3Sub: string;
    searchAddress: string;
    fullAddress: string;
    fullAddressPh: string;
    pinOnMap: string;
    enterAddressToPin: string;
    saudiOnly: string;
    searchPh: string;
    noMatchTitle: string;
    noMatchHint: string;
    locationPinned: string;
    locationConfirmed: string;
    saudiArabia: string;
    searchBtn: string;
    searching: string;
    noResults: string;
    geocodeError: string;
    clickMapHint: string;
    outsideSaudi: string;
    s4Title: string;
    s4Sub: string;
    dragPhotos: string;
    pngJpgMax: string;
    uploadedCount: (n: number, max: number) => string;
    photoRequired: string;
    photoTip: string;
    cover: string;
    setCover: string;
    uploading: string;
    uploadFailed: string;
    fileTooLarge: (mb: number) => string;
    replaceFile: string;
    s5Title: string;
    s5Sub: string;
    licenseNo: string;
    uploaded: string;
    name: string;
    typeLabel: string;
    priceLabel: string;
    sarPerNight: (p: string) => string;
    capacity: string;
    capacitySummary: (rooms: number, beds: number, baths: number, guests: number) => string;
    amenitiesCount: (n: number) => string;
    address: string;
    coordinates: string;
    photosUploaded: string;
    photosCount: (n: number) => string;
    coverPhoto: string;
    photoN: (n: number) => string;
    uploadedPhotos: string;
    allComplete: string;
    submitError: string;
    submittedSuccessfully: string;
    submittedBody: string;
    backToProperties: string;
  };
  monthsShort: string[];
  unitStatus: Record<"draft" | "pending" | "approved" | "rejected", string>;
  bookingStatus: Record<"pending_payment" | "confirmed" | "completed" | "cancelled", string>;
  dayStatus: Record<"available" | "booked" | "blocked" | "external", string>;
  propertyType: Record<"apartment" | "studio" | "villa", string>;
  common: Record<
    | "all" | "search" | "save" | "saveDraft" | "submit" | "cancel" | "close"
    | "back" | "next" | "edit" | "delete" | "view" | "loading" | "retry"
    | "copyLink" | "copied" | "required" | "language",
    string
  >;
  states: Record<"errorTitle" | "errorBody" | "offline" | "notFound" | "serverError", string>;
};
