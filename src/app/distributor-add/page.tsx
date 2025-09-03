'use client';
import { useState } from 'react';
import Navigation from '@/components/Navigation';

export default function DistributorAddPage() {
  const [formData, setFormData] = useState({
    distributorName: '',
    distributorId: '',
    email: '',
    phone: '',
    commissionRate: '10',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('총판 추가:', formData);
    // 실제 총판 추가 로직 구현
  };

  const handleCancel = () => {
    if (confirm('작성을 취소하시겠습니까?')) {
      console.log('작성 취소');
      // 실제 취소 로직 구현
    }
  };

  return (
    <div className="wrapper">
      <Navigation />
      <div className="content-wrapper">
        <section className="content-header">
          <h1>
            총판추가 <small></small>
          </h1>
          <ol className="breadcrumb">
            <li><a href="/">홈</a></li>
            <li><a href="/distributor">총판관리</a></li>
            <li className="active">총판추가</li>
          </ol>
        </section>

        <section className="content">
          <div className="row">
            <div className="col-xs-12">
              <div className="clearfix"></div>
              <div className="box box-purple">
                <div className="box-header with-border">
                  <h3 className="box-title">새 총판 정보 입력</h3>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="box-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="distributorName">총판명 *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="distributorName"
                            name="distributorName"
                            value={formData.distributorName}
                            onChange={handleInputChange}
                            placeholder="총판명을 입력하세요"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="distributorId">총판 ID *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="distributorId"
                            name="distributorId"
                            value={formData.distributorId}
                            onChange={handleInputChange}
                            placeholder="총판 ID를 입력하세요"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="email">이메일 *</label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="이메일을 입력하세요"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="phone">연락처 *</label>
                          <input
                            type="tel"
                            className="form-control"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="연락처를 입력하세요"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="commissionRate">수수료율 (%) *</label>
                          <select
                            className="form-control"
                            id="commissionRate"
                            name="commissionRate"
                            value={formData.commissionRate}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="5">5%</option>
                            <option value="8">8%</option>
                            <option value="10">10%</option>
                            <option value="12">12%</option>
                            <option value="15">15%</option>
                            <option value="18">18%</option>
                            <option value="20">20%</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="description">비고</label>
                          <textarea
                            className="form-control"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="추가 정보를 입력하세요"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="box-footer">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="pull-right">
                          <button
                            type="button"
                            className="btn btn-default"
                            onClick={handleCancel}
                            style={{ marginRight: '10px' }}
                          >
                            <i className="fa fa-times"></i> 취소
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary btn-purple"
                          >
                            <i className="fa fa-save"></i> 저장
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
