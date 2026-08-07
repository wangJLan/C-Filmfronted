declare namespace API {
  type adminCancelParams = {
    id: string;
  };

  type adminDetailParams = {
    id: string;
  };

  type adminListParams = {
    pageNum?: number;
    pageSize?: number;
    status?: string;
    orderNo?: string;
    userId?: string;
    filmName?: string;
    cinemaName?: string;
    hallName?: string;
  };

  type BaseResponseBoolean = {
    code?: number;
    data?: boolean;
    message?: string;
  };

  type BaseResponseChatHistory = {
    code?: number;
    data?: ChatHistory;
    message?: string;
  };

  type BaseResponseChatSession = {
    code?: number;
    data?: ChatSession;
    message?: string;
  };

  type BaseResponseCinema = {
    code?: number;
    data?: Cinema;
    message?: string;
  };

  type BaseResponseDashboardVO = {
    code?: number;
    data?: DashboardVO;
    message?: string;
  };

  type BaseResponseFilm = {
    code?: number;
    data?: Film;
    message?: string;
  };

  type BaseResponseHall = {
    code?: number;
    data?: Hall;
    message?: string;
  };

  type BaseResponseInteger = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponseListChatHistory = {
    code?: number;
    data?: ChatHistory[];
    message?: string;
  };

  type BaseResponseListChatSession = {
    code?: number;
    data?: ChatSession[];
    message?: string;
  };

  type BaseResponseListCinema = {
    code?: number;
    data?: Cinema[];
    message?: string;
  };

  type BaseResponseListFilm = {
    code?: number;
    data?: Film[];
    message?: string;
  };

  type BaseResponseListHall = {
    code?: number;
    data?: Hall[];
    message?: string;
  };

  type BaseResponseListSchedule = {
    code?: number;
    data?: Schedule[];
    message?: string;
  };

  type BaseResponseListScheduleVO = {
    code?: number;
    data?: ScheduleVO[];
    message?: string;
  };

  type BaseResponseListSeat = {
    code?: number;
    data?: Seat[];
    message?: string;
  };

  type BaseResponseListSystemConfig = {
    code?: number;
    data?: SystemConfig[];
    message?: string;
  };

  type BaseResponseLoginUserVO = {
    code?: number;
    data?: LoginUserVO;
    message?: string;
  };

  type BaseResponseLong = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponseMapStringObject = {
    code?: number;
    data?: Record<string, any>;
    message?: string;
  };

  type BaseResponseMapStringString = {
    code?: number;
    data?: Record<string, any>;
    message?: string;
  };

  type BaseResponseOrderVO = {
    code?: number;
    data?: OrderVO;
    message?: string;
  };

  type BaseResponsePageChatHistory = {
    code?: number;
    data?: PageChatHistory;
    message?: string;
  };

  type BaseResponsePageCinema = {
    code?: number;
    data?: PageCinema;
    message?: string;
  };

  type BaseResponsePageFilm = {
    code?: number;
    data?: PageFilm;
    message?: string;
  };

  type BaseResponsePageHall = {
    code?: number;
    data?: PageHall;
    message?: string;
  };

  type BaseResponsePageOrder = {
    code?: number;
    data?: PageOrder;
    message?: string;
  };

  type BaseResponsePageOrderVO = {
    code?: number;
    data?: PageOrderVO;
    message?: string;
  };

  type BaseResponsePageSchedule = {
    code?: number;
    data?: PageSchedule;
    message?: string;
  };

  type BaseResponsePageSeat = {
    code?: number;
    data?: PageSeat;
    message?: string;
  };

  type BaseResponsePageSystemConfig = {
    code?: number;
    data?: PageSystemConfig;
    message?: string;
  };

  type BaseResponsePageUserVO = {
    code?: number;
    data?: PageUserVO;
    message?: string;
  };

  type BaseResponsePayOrderVO = {
    code?: number;
    data?: PayOrderVO;
    message?: string;
  };

  type BaseResponseSchedule = {
    code?: number;
    data?: Schedule;
    message?: string;
  };

  type BaseResponseSeat = {
    code?: number;
    data?: Seat;
    message?: string;
  };

  type BaseResponseSeatMapVO = {
    code?: number;
    data?: SeatMapVO;
    message?: string;
  };

  type BaseResponseString = {
    code?: number;
    data?: string;
    message?: string;
  };

  type BaseResponseSystemConfig = {
    code?: number;
    data?: SystemConfig;
    message?: string;
  };

  type BaseResponseUser = {
    code?: number;
    data?: User;
    message?: string;
  };

  type BaseResponseUserPreference = {
    code?: number;
    data?: UserPreference;
    message?: string;
  };

  type BaseResponseUserVO = {
    code?: number;
    data?: UserVO;
    message?: string;
  };

  type cancelOrderParams = {
    id: string;
  };

  type ChangePasswordRequest = {
    oldPassword?: string;
    newPassword?: string;
    checkPassword?: string;
  };

  type ChatHistory = {
    id?: string;
    message?: string;
    messageType?: string;
    sessionId?: string;
    userId?: string;
    createTime?: string;
    updateTime?: string;
    isDelete?: number;
  };

  type ChatHistoryQueryRequest = {
    pageNum?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    id?: string;
    sessionId?: string;
    messageType?: string;
    userId?: string;
  };

  type ChatSession = {
    id?: string;
    sessionName?: string;
    userId?: string;
    editTime?: string;
    createTime?: string;
    updateTime?: string;
    isDelete?: number;
  };

  type checkLoginParams = {
    ticket: string;
  };

  type Cinema = {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    longitude?: number;
    latitude?: number;
    phone?: string;
    businessHours?: string;
    tags?: string;
    basePrice?: number;
    status?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type ConflictCheckRequest = {
    hallId?: string;
    showDate?: string;
    startTime?: string;
    endTime?: string;
    excludeScheduleId?: string;
  };

  type CreateOrderRequest = {
    scheduleId?: string;
    seatIds?: string[];
  };

  type createParams = {
    userId: string;
  };

  type DashboardVO = {
    todayOrders?: number;
    todayRevenue?: number;
    totalFilms?: number;
    totalCinemas?: number;
    totalUsers?: number;
    todaySchedules?: number;
  };

  type DeleteRequest = {
    id?: string;
  };

  type doChat1Params = {
    message: string;
    conversationId: string;
  };

  type doChatStream1Params = {
    message: string;
    conversationId: string;
    userId?: string;
  };

  type doChatStream2Params = {
    message: string;
    conversationId: string;
  };

  type doChatStreamParams = {
    message: string;
    conversationId: string;
    userId?: string;
  };

  type doSmartStreamParams = {
    message: string;
    conversationId: string;
    userId?: string;
  };

  type Film = {
    id?: string;
    name?: string;
    englishName?: string;
    type?: string;
    rating?: number;
    duration?: number;
    posterUrl?: string;
    releaseDate?: string;
    director?: string;
    actors?: string;
    description?: string;
    status?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
    formatTags?: string[];
  };

  type FilmQueryRequest = {
    pageNum?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    keyword?: string;
    type?: string;
    status?: string;
    minRating?: number;
  };

  type getByKeyParams = {
    configKey: string;
  };

  type getCurrentSessionParams = {
    userId: string;
  };

  type getFilmParams = {
    id: string;
  };

  type getInfo1Params = {
    id: string;
  };

  type getInfo2Params = {
    id: string;
  };

  type getInfo3Params = {
    id: string;
  };

  type getInfo4Params = {
    id: string;
  };

  type getInfo5Params = {
    id: string;
  };

  type getInfo6Params = {
    id: string;
  };

  type getInfo7Params = {
    id: string;
  };

  type getInfo8Params = {
    id: string;
  };

  type getInfo9Params = {
    id: string;
  };

  type getInfoParams = {
    id: string;
  };

  type getOrderDetailParams = {
    id: string;
  };

  type getSeatMapParams = {
    scheduleId: string;
  };

  type getUserByIdParams = {
    id: string;
  };

  type getUserVOByIdParams = {
    id: string;
  };

  type Hall = {
    id?: string;
    cinemaId?: string;
    name?: string;
    hallType?: string;
    rowCount?: number;
    colCount?: number;
    seatTemplate?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type listByCinemaParams = {
    cinemaId: string;
  };

  type listBySessionParams = {
    sessionId: string;
  };

  type listByUserParams = {
    userId: string;
  };

  type listFilmParams = {
    filmQueryRequest: FilmQueryRequest;
  };

  type listOrdersParams = {
    pageNum?: number;
    pageSize?: number;
    status?: string;
  };

  type listScheduleParams = {
    filmId?: string;
    cinemaId?: string;
    showDate?: string;
  };

  type LockSeatRequest = {
    scheduleId?: string;
    seatIds?: string[];
  };

  type LoginUserVO = {
    id?: string;
    userAccount?: string;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
    createTime?: string;
    updateTime?: string;
    needSetPassword?: boolean;
  };

  type MailLoginRequest = {
    email?: string;
    code?: string;
  };

  type MovieChatRequest = {
    message?: string;
    conversationId?: string;
    userId?: string;
  };

  type nowShowingParams = {
    limit?: number;
  };

  type Order = {
    id?: string;
    orderNo?: string;
    userId?: string;
    scheduleId?: string;
    filmName?: string;
    cinemaName?: string;
    scheduleTime?: string;
    hallName?: string;
    totalPrice?: number;
    count?: number;
    status?: string;
    cancelReason?: string;
    alipayTradeNo?: string;
    alipayStatus?: string;
    paidAt?: string;
    expireAt?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type OrderSeat = {
    id?: string;
    orderId?: string;
    seatId?: string;
    seatLabel?: string;
    isUsed?: boolean;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type OrderVO = {
    id?: string;
    orderNo?: string;
    userId?: string;
    scheduleId?: string;
    filmName?: string;
    cinemaName?: string;
    scheduleTime?: string;
    hallName?: string;
    totalPrice?: number;
    count?: number;
    status?: string;
    cancelReason?: string;
    paidAt?: string;
    expireAt?: string;
    createTime?: string;
    refundAmount?: number;
    refundTime?: string;
    /** 影院标签（逗号分隔），用于判断是否支持退票/改签 */
    cinemaTags?: string;
    /** 影片海报（通过场次-影片链路获取） */
    posterUrl?: string;
    seatLabels?: string[];
    /** 订单内的票列表（每座位一票，含独立取票码和核销状态） */
    tickets?: TicketVO[];
  };

  type TicketVO = {
    id?: string;
    orderId?: string;
    scheduleId?: string;
    seatId?: string;
    seatLabel?: string;
    ticketCode?: string;
    /** 核销状态: 0-未核销 1-已核销 2-已退票 3-已过期 */
    status?: number;
    checkedInAt?: string;
    checkedBy?: number;
    orderNo?: string;
    orderStatus?: string;
    filmName?: string;
    cinemaName?: string;
    hallName?: string;
    scheduleTime?: string;
  };

  type page4Params = {
    page: PageUserPreference;
  };

  type page5Params = {
    page: PageSystemConfig;
  };

  type page6Params = {
    page: PageOrderSeat;
  };

  type page7Params = {
    page: PageHall;
  };

  type page8Params = {
    page: PageCinema;
  };

  type page9Params = {
    page: PageChatSession;
  };

  type PageChatHistory = {
    records?: ChatHistory[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageChatSession = {
    records?: ChatSession[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageCinema = {
    records?: Cinema[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageFilm = {
    records?: Film[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageHall = {
    records?: Hall[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageOrder = {
    records?: Order[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageOrderSeat = {
    records?: OrderSeat[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageOrderVO = {
    records?: OrderVO[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageSchedule = {
    records?: Schedule[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageSeat = {
    records?: Seat[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageSystemConfig = {
    records?: SystemConfig[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageUserPreference = {
    records?: UserPreference[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PageUserVO = {
    records?: UserVO[];
    pageNumber?: number;
    pageSize?: number;
    totalPage?: number;
    totalRow?: number;
    optimizeCountQuery?: boolean;
  };

  type PayOrderRequest = {
    orderId?: string;
    returnUrl?: string;
  };

  type PayOrderVO = {
    payForm?: string;
    orderNo?: string;
  };

  type payPageParams = {
    orderId: string;
  };

  type postParams = {
    signature: string;
    timestamp: string;
    nonce: string;
    openid: string;
    encrypt_type?: string;
    msg_signature?: string;
  };

  type recommendedParams = {
    limit?: number;
    type?: string;
    minRating?: number;
    excludeFilmId?: number;
  };

  type remove1Params = {
    id: string;
  };

  type remove2Params = {
    id: string;
  };

  type remove3Params = {
    id: string;
  };

  type remove4Params = {
    id: string;
  };

  type remove5Params = {
    id: string;
  };

  type remove6Params = {
    id: string;
  };

  type remove7Params = {
    id: string;
  };

  type remove8Params = {
    id: string;
  };

  type remove9Params = {
    id: string;
  };

  type removeParams = {
    id: string;
  };

  type renameParams = {
    id: string;
    name: string;
  };

  type resetConversation1Params = {
    conversationId: string;
  };

  type resetConversationParams = {
    conversationId: string;
  };

  type ResetPasswordRequest = {
    email?: string;
    code?: string;
    newPassword?: string;
    checkPassword?: string;
  };

  type reverseParams = {
    lat: number;
    lng: number;
  };

  type Schedule = {
    id?: string;
    filmId?: string;
    cinemaId?: string;
    hallId?: string;
    showDate?: string;
    startTime?: string;
    endTime?: string;
    price?: number;
    vipPrice?: number;
    status?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type ScheduleVO = {
    id?: string;
    filmId?: string;
    cinemaId?: string;
    hallId?: string;
    showDate?: string;
    startTime?: string;
    endTime?: string;
    price?: number;
    vipPrice?: number;
    status?: string;
    filmName?: string;
    filmPoster?: string;
    filmDuration?: number;
    filmRating?: string;
    filmType?: string;
    cinemaName?: string;
    cinemaAddress?: string;
    hallName?: string;
    hallType?: string;
    hallRowCount?: number;
    hallColCount?: number;
  };

  type searchParams = {
    keyword: string;
    pageNum?: number;
    pageSize?: number;
  };

  type Seat = {
    id?: string;
    scheduleId?: string;
    hallId?: string;
    rowNum?: number;
    colNum?: number;
    seatLabel?: string;
    zone?: string;
    status?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type SeatMapVO = {
    hallId?: string;
    hallName?: string;
    hallType?: string;
    rowCount?: number;
    colCount?: number;
    scheduleId?: string;
    price?: number;
    vipPrice?: number;
    seats?: Seat[];
    /** 横向过道（行间加宽）：这些行之后插入过道 */
    aisleRows?: number[];
    /** 纵向过道（列间加宽）：这些列之后插入过道 */
    aisleCols?: number[];
    /** 每行独立列数（缺省用 colCount），按物理格遍历 */
    rowOverrides?: Record<number, number>;
  };

  type SendMailCodeRequest = {
    email?: string;
    captcha?: string;
  };

  type ServerSentEventString = true;

  type SetPasswordRequest = {
    newPassword?: string;
    checkPassword?: string;
  };

  type SystemConfig = {
    id?: string;
    configKey?: string;
    configValue?: string;
    description?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type updateStatusParams = {
    id: string;
    status: string;
  };

  type uploadFileParams = {
    uploadFileRequest: UploadFileRequest;
  };

  type UploadFileRequest = {
    biz?: string;
  };

  type User = {
    id?: string;
    userAccount?: string;
    userPassword?: string;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
    editTime?: string;
    createTime?: string;
    updateTime?: string;
    isDelete?: number;
  };

  type UserAddRequest = {
    userName?: string;
    userAccount?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserPreference = {
    id?: string;
    userId?: string;
    preferredTypes?: string;
    preferredHallType?: string;
    budgetMax?: number;
    frequentCinemaId?: string;
    preferredSeatZone?: string;
    isDelete?: boolean;
    createTime?: string;
    updateTime?: string;
  };

  type UserQueryRequest = {
    pageNum?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    id?: string;
    userName?: string;
    userAccount?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserRegisterRequest = {
    userAccount?: string;
    userPassword?: string;
    checkPassword?: string;
  };

  type UserUpdateRequest = {
    id?: string;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserVO = {
    id?: string;
    userAccount?: string;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
    createTime?: string;
  };

  type validateParams = {
    signature?: string;
    timestamp?: string;
    nonce?: string;
    echostr?: string;
  };

  type weixinLoginParams = {
    openid: string;
  };
}
