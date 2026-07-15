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
    },
    reports: {
      title: "التقارير والتحليلات",
      subtitle: "رؤى مالية وأداء",
      exportPdf: "تصدير PDF",
      exportCsv: "تصدير CSV",
      commission: "عمولة مَمسَى (2%)",
      netProfit: "صافي الربح",
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
      quickBlockSub: "احجب التواريخ عبر كل الوحدات أو وحدات محددة",
      blockReasonPh: "السبب (اختياري)",
      blockSelectedDates: "حجب التواريخ المحددة",
      weekdays: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
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
      ibanInvalid: "رقم الآيبان غير صحيح (يبدأ بـ SA ثم 22 رقمًا)",
    },
    pm: {
      previewTitle: "معاينة الوحدة",
      reviews: (n: number) => `(${n} تقييم)`,
      bedrooms: "غرف النوم",
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
      paid: "مدفوع",
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
      // Step 3
      s3Title: "الموقع",
      s3Sub: "يجب أن يقع عقارك داخل السعودية ليُدرج على المنصة.",
      searchAddress: "البحث عن العنوان",
      fullAddress: "العنوان الكامل للعقار",
      fullAddressPh: "الشارع، الحي، المدينة، المنطقة",
      pinOnMap: "تحديد الموقع على الخريطة",
      enterAddressToPin: "أدخل العنوان أعلاه لتحديد الموقع",
      saudiOnly: "داخل السعودية فقط",
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
      bedGuest: (b: number, g: number) => `${b} غرفة · ${g} ضيوف`,
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
    },
    reports: {
      title: "Reports & Analytics",
      subtitle: "Financial and performance insights",
      exportPdf: "Export PDF",
      exportCsv: "Export CSV",
      commission: "Mamsa Commission (2%)",
      netProfit: "Net Profit",
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
      quickBlockSub: "Block dates across all or specific properties",
      blockReasonPh: "Reason (optional)",
      blockSelectedDates: "Block Selected Dates",
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
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
      ibanInvalid: "Invalid IBAN (must start with SA, then 22 digits)",
    },
    pm: {
      previewTitle: "Property Preview",
      reviews: (n: number) => `(${n} reviews)`,
      bedrooms: "Bedrooms",
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
      paid: "Paid",
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
      // Step 3
      s3Title: "Location",
      s3Sub: "Your property must be located within Saudi Arabia to be listed on the platform.",
      searchAddress: "Search Address",
      fullAddress: "Full Property Address",
      fullAddressPh: "Street, district, city, region",
      pinOnMap: "Pin location on map",
      enterAddressToPin: "Enter the address above to pin location",
      saudiOnly: "Saudi Arabia only",
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
      bedGuest: (b: number, g: number) => `${b} bed · ${g} guests`,
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
    "overview" | "units" | "calendar" | "bookings" | "reports" | "account" | "notifications" | "logout",
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
  };
  reports: {
    title: string;
    subtitle: string;
    exportPdf: string;
    exportCsv: string;
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
    ibanInvalid: string;
  };
  pm: {
    previewTitle: string;
    reviews: (n: number) => string;
    bedrooms: string;
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
    paid: string;
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
    s3Title: string;
    s3Sub: string;
    searchAddress: string;
    fullAddress: string;
    fullAddressPh: string;
    pinOnMap: string;
    enterAddressToPin: string;
    saudiOnly: string;
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
    s5Title: string;
    s5Sub: string;
    licenseNo: string;
    uploaded: string;
    name: string;
    typeLabel: string;
    priceLabel: string;
    sarPerNight: (p: string) => string;
    capacity: string;
    bedGuest: (b: number, g: number) => string;
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
  bookingStatus: Record<"confirmed" | "completed" | "cancelled", string>;
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
