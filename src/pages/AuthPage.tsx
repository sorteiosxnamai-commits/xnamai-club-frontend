import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { useAuth } from '../auth/AuthContext';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', companyName: '', email: '', password: '' });

  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    try {
      const user = mode === 'login' ? await login(form.email, form.password) : await register(form);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (sessionStorage.getItem('selected_plan')) navigate('/checkout');
      else navigate('/app');
    } catch (e) { setError((e as Error).message); }
  }

  return <><PublicHeader/><main className="auth-page"><form className="auth-card" onSubmit={submit}><div className="eyebrow">XNAMAI CLUB</div><h1>{mode === 'login' ? 'Entrar na sua conta' : 'Crie sua conta'}</h1>{mode === 'register' && <><label>Nome<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Empresa<input value={form.companyName} onChange={e=>setForm({...form,companyName:e.target.value})}/></label></>}<label>E-mail<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label><label>Senha<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} minLength={8} required/></label>{error && <div className="error-box">{error}</div>}<button className="btn primary large full">{mode === 'login' ? 'Entrar' : 'Continuar para pagamento'}</button><p className="auth-switch">{mode === 'login' ? <>Não possui conta? <Link to="/cadastro">Cadastre-se</Link></> : <>Já possui conta? <Link to="/login">Entrar</Link></>}</p>{mode === 'login' && <p className="demo-note">Admin demo: admin@xnamai.local / Admin123!</p>}</form></main></>;
}
