import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const perPage = 10;

  try {
    let query = supabase
      .from('siswa')
      .select('*', { count: 'exact' })
      .range((page - 1) * perPage, page * perPage - 1);

    if (search) {
      query = query.ilike('nama', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { error, data } = await supabase
      .from('siswa')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
