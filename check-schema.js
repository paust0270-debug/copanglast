const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cwsdvgkjptuvbdtxcejt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2R2Z2tqcHR1dmJkdHhjZWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTQ0MzksImV4cCI6MjA3MTk3MDQzOX0.kSKAYjtFWoxHn0PNq6mAZ2OEngeGR7i_FW3V75Hrby8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('settlements 테이블 스키마 확인 중...');
    
    // settlements 테이블 구조 확인
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('settlements 테이블 오류:', error);
    } else {
      console.log('settlements 테이블 구조:', data);
    }

    // settlement_items 테이블 구조 확인
    const { data: itemsData, error: itemsError } = await supabase
      .from('settlement_items')
      .select('*')
      .limit(1);
    
    if (itemsError) {
      console.error('settlement_items 테이블 오류:', itemsError);
    } else {
      console.log('settlement_items 테이블 구조:', itemsData);
    }

  } catch (err) {
    console.error('오류:', err);
  }
}

checkSchema();
