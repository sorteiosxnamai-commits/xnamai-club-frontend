export function Brand({ admin = false }: { admin?: boolean }) {
  return (
    <div className="brand-wrap">
      <div className="brand">xNaMai</div>
      {admin && <div className="brand-sub">CLUB ADMIN</div>}
    </div>
  );
}
