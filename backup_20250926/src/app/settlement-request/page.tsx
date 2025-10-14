'use client';
import { useState } from 'react';
import Navigation from '@/components/Navigation';

export default function SettlementRequestPage() {
  const [selectedUserGroup, setSelectedUserGroup] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('');

  const handleSearch = () => {
    console.log('검색 실행:', searchQuery);
    // 실제 검색 로직 구현
  };

  const handleExcelDownload = () => {
    console.log('엑셀 다운로드 실행');
    // 실제 엑셀 다운로드 로직 구현
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(e.target.value);
    console.log('날짜 범위 변경:', e.target.value);
    // 실제 날짜 필터링 로직 구현
  };

  const handleSettlementRequest = (settlementId: string) => {
    console.log('정산 요청:', settlementId);
    // 실제 정산 요청 로직 구현
  };

  const handleSettlementDetail = (settlementId: string) => {
    console.log('정산 상세:', settlementId);
    // 실제 정산 상세 로직 구현
  };

  const handleSettlementEdit = (settlementId: string) => {
    console.log('정산 편집:', settlementId);
    // 실제 정산 편집 로직 구현
  };

  const handleSettlementDelete = (settlementId: string) => {
    if (confirm('정산 요청을 삭제 하시겠습니까?')) {
      console.log('정산 삭제:', settlementId);
      // 실제 정산 삭제 로직 구현
    }
  };

  return (
    <div className="wrapper">
      <Navigation />
      <div className="content-wrapper">
        <section className="content-header">
          <h1>
            정산요청 <small></small>
          </h1>
          <ol className="breadcrumb">
            <li><a href="/">홈</a></li>
            <li><a href="#">정산관리</a></li>
            <li className="active">정산요청</li>
          </ol>
        </section>

        <section className="content">
          <div className="row">
            <div className="col-xs-12">
              <div className="clearfix"></div>
              <div className="box box-purple">
                <div className="box-header with-border">
                  <div className="pull-left form-inline">
                    <div className="form-group-sm">
                      <select
                        id="user_group"
                        className="form-control"
                        style={{ width: 'initial', display: 'inline-block' }}
                        value={selectedUserGroup}
                        onChange={(e) => setSelectedUserGroup(e.target.value)}
                      >
                        <option value="0">총판선택</option>
                        <option value="1">본사</option>
                        <option value="36">panda</option>
                        <option value="126">Wan-Nass</option>
                        <option value="131">phj1636 (엠씨컴퍼니)</option>
                        <option value="184">mezzah</option>
                        <option value="148">써머랭크관리자</option>
                        <option value="107">구대판다</option>
                        <option value="130">newjeanss</option>
                        <option value="161">helloup</option>
                        <option value="2">hcclogic</option>
                        <option value="162">rb62971</option>
                        <option value="5">egg</option>
                        <option value="14">adpang</option>
                        <option value="27">theking99(예전)</option>
                        <option value="30">yeonggwang01 (hcc)</option>
                        <option value="32">adresult (hcc)</option>
                        <option value="34">mpickad (hcc)</option>
                        <option value="45">lu</option>
                        <option value="46">gray (hcc)</option>
                        <option value="47">mmtcommunications1</option>
                        <option value="48">hanyeoleum3 (hcc)</option>
                        <option value="50">xovnd7218 (hcc)</option>
                        <option value="51">buywise2 (hcc)</option>
                        <option value="52">insider (hcc)</option>
                        <option value="53">CMK11123</option>
                        <option value="57">hhhjjjsss (hcc)</option>
                        <option value="69">lchkgy</option>
                        <option value="70">beengogh  (hcc)</option>
                        <option value="71">erank (hcc)</option>
                        <option value="77">kool104</option>
                        <option value="82">jung1 (hcc)</option>
                        <option value="88">sosa0357</option>
                        <option value="89">slink(본사)</option>
                        <option value="91">link1399</option>
                        <option value="94">lotem4 (일영)</option>
                        <option value="95">hlinead</option>
                        <option value="96">sosa0357</option>
                        <option value="97">parisjm(HCC)</option>
                        <option value="98">ssu7980</option>
                        <option value="99">wlsqja201</option>
                        <option value="101">dbgdbg (hcc)</option>
                        <option value="102">dats (hcc)</option>
                        <option value="103">coelabs</option>
                        <option value="104">mjcad</option>
                        <option value="105">wlguq</option>
                        <option value="106">pullim</option>
                        <option value="108">atomhitman</option>
                        <option value="109">abfzks1</option>
                        <option value="110">boosty</option>
                        <option value="111">프라이트 총판</option>
                        <option value="112">adwin</option>
                        <option value="113">parisjm</option>
                        <option value="114">rb6297</option>
                        <option value="115">lu987</option>
                        <option value="116">zkcld123</option>
                        <option value="117">boim123(보임마케팅)</option>
                        <option value="118">ourad</option>
                        <option value="119">entrepreneur</option>
                        <option value="120">giamvaco</option>
                        <option value="121">js0919</option>
                        <option value="122">wlsqja201</option>
                        <option value="123">21</option>
                        <option value="124">cmad</option>
                        <option value="125">kembler206 (태강컴퍼니)</option>
                        <option value="127">adcenterkorea</option>
                        <option value="128">smj1004</option>
                        <option value="129">adddot1</option>
                        <option value="132">rainyshy333 (봄양)</option>
                        <option value="133">khanindustries</option>
                        <option value="134">test1122</option>
                        <option value="135">youup (애드매니저)</option>
                        <option value="136">ryuma1119 (TNS 대표 (고래방)</option>
                        <option value="137">pnm0321 (피앤엠)</option>
                        <option value="138">jmtechno (이민지)제이엠테크노</option>
                        <option value="139">ekekeksk123 (주성우)</option>
                        <option value="140">jseok007 (팅케마)</option>
                        <option value="141">gpcom1206(팅케마)</option>
                        <option value="142">danm0929 (프라이트)</option>
                        <option value="143">itemoffice (잇템커머스)</option>
                        <option value="144">조상민</option>
                        <option value="145">theking99</option>
                        <option value="146">dhehdrlf27 (오동길)</option>
                        <option value="147">sunset (김택수)(티에스애드)</option>
                        <option value="149">aiie2526 (주식회사 글로씨)</option>
                        <option value="150">tomman0117 (초록샵)</option>
                        <option value="151">uecompany (써머랭크)</option>
                        <option value="152">coelabs</option>
                        <option value="153">wlsqja201</option>
                        <option value="154">unnamed (언네임드)</option>
                        <option value="155">mnkpartner</option>
                        <option value="156">wnwc</option>
                        <option value="157">daily_w</option>
                        <option value="158">tzha2300(디에이치컴퍼니)</option>
                        <option value="159">rnjsdntjd11</option>
                        <option value="160">wins</option>
                        <option value="163">sptest</option>
                        <option value="164">hello1234</option>
                        <option value="165">mmmm</option>
                        <option value="166">pullim1</option>
                        <option value="167">lovesun159</option>
                        <option value="168">qkdlfjf11</option>
                        <option value="169">idealm</option>
                        <option value="170">wlguq230405(지협)</option>
                        <option value="171">slink 총판</option>
                        <option value="172">wlsqja201</option>
                        <option value="173">benjamin</option>
                        <option value="174">dhzpdl123 (5K커뮤니케이션즈)</option>
                        <option value="175">mktrend (엠케이랜드)</option>
                        <option value="176">viralkim (엠케이랜드)</option>
                        <option value="177">womwom</option>
                        <option value="178">flap1234 (플랩)</option>
                        <option value="179">monteur</option>
                        <option value="180">ckdgus002</option>
                        <option value="181">hlinead</option>
                        <option value="182">슈퐁크 (smjkorea)</option>
                        <option value="183">prime</option>
                        <option value="185">toyou</option>
                        <option value="186">plejoy</option>
                        <option value="187">panda123 (리빙웰)</option>
                        <option value="188">zxc8520</option>
                        <option value="189">1best</option>
                        <option value="190">wjdtjr07</option>
                        <option value="191">admin2001</option>
                        <option value="192">pris</option>
                        <option value="193">neonwave</option>
                        <option value="194">firetoo</option>
                        <option value="195">panda [플레이스전용]</option>
                        <option value="196">able0000</option>
                        <option value="198">jsol</option>
                        <option value="199">plejoy1</option>
                        <option value="200">tmdwls8913</option>
                        <option value="201">vdgarena</option>
                      </select>
                    </div>
                  </div>
                  <div className="pull-right">
                    <div className="input-group input-group-sm" style={{ width: '300px', display: 'inline-table' }}>
                      <input
                        type="text"
                        name="query"
                        className="form-control pull-right"
                        placeholder="검색 (아이디,고객명)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <div className="input-group-btn">
                        <button type="button" className="btn btn-default search" onClick={handleSearch}>
                          <i className="fa fa-search"></i>
                        </button>
                      </div>
                    </div>
                    <div className="pull-right">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="날짜 범위 선택"
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        style={{ width: '200px', marginLeft: '10px' }}
                      />
                      <button
                        className="btn btn-primary btn-purple btn-sm"
                        style={{ marginLeft: '3px' }}
                        id="saveExcel"
                        type="button"
                        onClick={handleExcelDownload}
                      >
                        <i className="fas fa-file-excel"></i> 엑셀 다운로드
                      </button>
                    </div>
                  </div>
                </div>
                <div className="box-body">
                  <div className="row">
                    <div className="col-sm-12">
                      <div className="table-responsive">
                        <table className="table table-striped table-hover" id="settlement-requests-table">
                          <thead>
                            <tr>
                              <th>No</th>
                              <th>소속총판</th>
                              <th>아이디</th>
                              <th>고객명</th>
                              <th>정산금액</th>
                              <th>요청일</th>
                              <th>상태</th>
                              <th>비고</th>
                              <th>관리</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>1</td>
                              <td>
                                <a href="#" onClick={() => console.log('총판 필터: firetoo')}>
                                  <code>firetoo</code>
                                </a>
                              </td>
                              <td>_PD_totebag</td>
                              <td>토트백</td>
                              <td>
                                <span className="text-warning">50,000원</span>
                              </td>
                              <td>
                                <small>2025-08-28</small>
                              </td>
                              <td>
                                <span className="label label-warning">대기</span>
                              </td>
                              <td>정산 요청 대기</td>
                              <td>
                                <div className="btn-group">
                                  <a href="#" className="btn btn-info btn-sm" onClick={() => handleSettlementDetail('1')}>
                                    <i className="fa fa-eye" aria-hidden="true"></i> 상세
                                  </a>
                                  <a href="#" className="btn btn-primary btn-sm" onClick={() => handleSettlementRequest('1')}>
                                    <i className="fa fa-paper-plane" aria-hidden="true"></i> 요청
                                  </a>
                                  <a href="#" className="btn btn-default btn-sm" onClick={() => handleSettlementEdit('1')}>
                                    <i className="fa fa-pen" aria-hidden="true"></i> 편집
                                  </a>
                                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleSettlementDelete('1')}>
                                    <i className="fa fa-times" aria-hidden="true"></i> 삭제
                                  </button>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td>2</td>
                              <td>
                                <a href="#" onClick={() => console.log('총판 필터: toyou')}>
                                  <code>toyou</code>
                                </a>
                              </td>
                              <td>_PD_kyon</td>
                              <td>케이와이온</td>
                              <td>
                                <span className="text-warning">30,000원</span>
                              </td>
                              <td>
                                <small>2025-08-27</small>
                              </td>
                              <td>
                                <span className="label label-warning">대기</span>
                              </td>
                              <td>정산 요청 대기</td>
                              <td>
                                <div className="btn-group">
                                  <a href="#" className="btn btn-info btn-sm" onClick={() => handleSettlementDetail('2')}>
                                    <i className="fa fa-eye" aria-hidden="true"></i> 상세
                                  </a>
                                  <a href="#" className="btn btn-primary btn-sm" onClick={() => handleSettlementRequest('2')}>
                                    <i className="fa fa-paper-plane" aria-hidden="true"></i> 요청
                                  </a>
                                  <a href="#" className="btn btn-default btn-sm" onClick={() => handleSettlementEdit('2')}>
                                    <i className="fa fa-pen" aria-hidden="true"></i> 편집
                                  </a>
                                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleSettlementDelete('2')}>
                                    <i className="fa fa-times" aria-hidden="true"></i> 삭제
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
