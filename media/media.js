<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RESCENE ARCHIVE | MEDIA</title>
    <meta name="description" content="RESCENE YOUTUBE ARCHIVE">
    <link rel="icon" type="image/png" href="../images/logo.png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400;600;800;900&family=Noto+Sans+KR:wght@200;300;400;500;700&family=Plus+Jakarta+Sans:wght@300;400;500;700&family=Gaegu:wght@400;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/index.css">
    <link rel="stylesheet" href="../css/modal.css">
    <link rel="stylesheet" href="../css/i18n.css">
    <link rel="stylesheet" href="media.css">

    <script src="../js/theme-init.js"></script>
</head>
<body>

    <div id="siteNavSlot"></div>
    <script src="../js/layout.js"></script>
    <script>renderSiteNav('media', '../', { calendar: true, lang: true });</script>

    <div id="mainWrapper" style="padding-top: 120px; min-height: 100vh; display: flex; flex-direction: column;">
        <!-- ⭐️ 100% 꽉 찬 너비로 복구 -->
        <div class="section-container media-page-container" style="flex: 1;">
            <div class="section-header media-hero">
                <div class="section-title" data-i18n="mediaTitle">MEDIA <span>ARCHIVE</span></div>
            </div>
            <p class="media-hero-sub"><span data-i18n="mediaSub">리센느 유튜브 모아보기</span> <span class="media-count-badge" id="mediaCountBadge"></span></p>

            <div class="media-layout">
                
                <!-- ⭐️ 좌측 사이드바 필터 (고정, 클릭 시 옆으로 넓게 퍼지는 가로 구조) -->
                <aside class="media-sidebar">
                    <div class="ms-col">
                        <div class="ms-title">CATEGORY</div>
                        <div class="ms-list" id="mediaTagRow"></div>
                    </div>
                    <div class="ms-col is-hidden" id="mediaYearColWrap">
                        <div class="ms-title">YEAR</div>
                        <div class="ms-list" id="mediaYearCol"></div>
                    </div>
                    <div class="ms-col is-hidden" id="mediaSubColWrap">
                        <div class="ms-title">DETAIL</div>
                        <div class="ms-list" id="mediaSubCol"></div>
                    </div>
                </aside>

                <!-- ⭐️ 우측 메인 컨텐츠 영역 -->
                <main class="media-main">
                    <div class="media-toolbar">
                        <!-- ⭐️ 왼쪽 툴바 (고급 필터 버튼 + 검색창) -->
                        <div class="media-toolbar-left">
                            <button type="button" class="adv-filter-btn" onclick="openAdvFilter()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                <span>Filter</span>
                            </button>
                            
                            <div class="media-search-wrap">
                                <svg class="msw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <input type="text" id="mediaSearch" placeholder="제목 · 채널 검색" data-i18n-placeholder="searchPlaceholder" oninput="mediaApplyFilters()" autocomplete="off">
                                <button type="button" class="media-search-clear" id="mediaSearchClear" onclick="mediaClearSearch()" aria-label="검색어 지우기">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>
                        
                        <!-- ⭐️ 오른쪽 툴바 (정렬 탭) -->
                        <div class="media-toolbar-right">
                            <div class="media-sort-group" role="group" aria-label="정렬">
                                <button type="button" class="msort-btn active" id="sortDateNew" onclick="mediaSetSort('date','desc')">
                                    <span data-i18n="sortNewest">최신순</span>
                                </button>
                                <button type="button" class="msort-btn" id="sortDateOld" onclick="mediaSetSort('date','asc')">
                                    <span data-i18n="sortOldest">오래된순</span>
                                </button>
                                <span class="msort-divider"></span>
                                <button type="button" class="msort-btn" id="sortNameAsc" onclick="mediaSetSort('name','asc')">
                                    <span data-i18n="sortNameAsc">가나다순</span>
                                </button>
                                <button type="button" class="msort-btn" id="sortNameDesc" onclick="mediaSetSort('name','desc')">
                                    <span data-i18n="sortNameDesc">역순</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 영상 그리드 -->
                    <div class="media-grid" id="mediaGrid"></div>
                    <div class="media-scroll-sentinel" id="mediaSentinel"></div>
                    <div class="media-end-message" id="mediaEndMessage" style="display:none;" data-i18n="mediaAllDone">모든 영상을 다 봤어요.</div>
                </main>
            </div>
        </div>

        <div id="siteFooterSlot"></div>
        <script>renderSiteFooter('../');</script>
    </div>

    <!-- ⭐️ 왼쪽에서 나타나는 고급 필터 다중선택 서랍 (Drawer) -->
    <div class="drawer-backdrop" id="advFilterBackdrop" onclick="closeAdvFilter()"></div>
    <div class="adv-filter-drawer" id="advFilterDrawer">
        <div class="afd-header">
            <h3>Filters</h3>
            <button class="afd-close" onclick="closeAdvFilter()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
        <div class="afd-body">
            <!-- 1. Filter by category -->
            <div class="afd-section">
                <div class="afd-sec-title">Filter by category <span id="afdCatCount">0 chips</span></div>
                <div class="afd-chips" id="afdCategoryChips"></div>
            </div>
            
            <!-- 2. Refine results (현재 적용된 필터) -->
            <div class="afd-section">
                <div class="afd-sec-title">Refine results <span>Closeable chips</span></div>
                <div class="afd-chips" id="afdActiveChips"></div>
                <button class="afd-action-btn" onclick="mediaClearAllFilters()">Clear All</button>
            </div>

            <!-- 3. Pick relevant topics (다중 선택 가능 칩) -->
            <div class="afd-section">
                <div class="afd-sec-title">Pick relevant topics <span id="afdTopicCount">Selected 0</span></div>
                <div class="afd-chips" id="afdTopicChips"></div>
                <button class="afd-action-btn btn-red" onclick="mediaResetTopics()">Reset</button>
            </div>
        </div>
    </div>

    <!-- 영상 재생 모달 -->
    <div class="modal-backdrop" id="mediaModalBackdrop" onclick="mediaClosePlayer()"></div>
    <div class="media-modal-wrapper" id="mediaModal">
        <button class="popup-close-btn" onclick="mediaClosePlayer()" aria-label="닫기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div class="media-modal-head">
            <div class="media-modal-title" id="mediaModalTitle"></div>
            <div class="media-modal-date" id="mediaModalDate"></div>
        </div>
        <div class="media-modal-media" id="mediaModalMedia"></div>
        <div class="media-modal-nav">
            <button type="button" class="mm-nav-btn" id="mediaPrevBtn" onclick="mediaPrev()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                <span data-i18n="prevVideo">이전 영상</span>
            </button>
            <button type="button" class="mm-nav-btn mm-nav-next" id="mediaNextBtn" onclick="mediaNext()">
                <span data-i18n="nextVideo">다음 영상</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        </div>
        <div class="media-modal-playlist" id="mediaModalPlaylist">
            <div class="mm-drag-handle" id="mmDragHandle">
                <span class="mm-drag-label"><span data-i18n="playlist">재생목록</span> <b id="mmPlaylistCount">0</b></span>
            </div>
            <ul class="mm-playlist-list" id="mmPlaylistList"></ul>
        </div>
    </div>

    <div id="siteCalendarSlot"></div>
    <script>renderCalendarWidgets();</script>

    <script src="../js/i18n.js"></script>
    <script>var SITE_ROOT = '../';</script>
    <script src="../js/member_data.js"></script>
    <script src="../js/common.js"></script>
    <script src="../js/contents_data.js"></script>
    <script src="../js/album_content_data.js"></script>
    <script src="../js/music_show_data.js"></script>
    <script src="../js/live_data.js"></script>
    <script src="../js/event_data.js"></script>
    <script src="../js/contents.js"></script>
    <script src="media.js"></script>
</body>
</html>
