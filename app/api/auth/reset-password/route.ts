import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Initialize Supabase admin client with Service Role Key
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if user exists first
        const { data: users, error: searchError } = await supabaseAdmin
            .from('users')
            .select('user_id')
            .eq('user_email', email)
            .single();

        if (searchError || !users) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Update password directly using admin privileges (bypasses RLS)
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ user_password: password })
            .eq('user_email', email);

        if (updateError) {
            console.error('Error updating password via API:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to update database' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error in reset-password API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
