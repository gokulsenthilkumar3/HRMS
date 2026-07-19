async function test() {
  try {
    const loginRes = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'emp001@company.com',
        password: 'Emp@001'
      })
    });
    
    if (!loginRes.ok) throw new Error('Login failed: ' + loginRes.status);
    
    const data = await loginRes.json();
    console.log('Login success');
    const token = data.access_token;
    
    const statsRes = await fetch('http://localhost:4000/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!statsRes.ok) {
        console.error('Stats failed:', statsRes.status, await statsRes.text());
        return;
    }
    const stats = await statsRes.json();
    console.log('Stats success', Object.keys(stats));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
