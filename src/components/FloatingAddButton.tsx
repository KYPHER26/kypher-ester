import { Link, useLocation } from 'react-router-dom';

export default function FloatingAddButton() {
  const { pathname } = useLocation();
  if (pathname === '/add' || pathname === '/login' || pathname.startsWith('/edit/')) return null;

  return (
    <Link
      to="/add"
      className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-rose text-white flex items-center justify-center text-2xl shadow-lg hover:bg-rose-dim transition-colors"
      aria-label="Add memory"
    >
      +
    </Link>
  );
}
