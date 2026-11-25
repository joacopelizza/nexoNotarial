import { FormEvent, useCallback, useEffect, useState } from 'react';
import './details.css';

const sections = [
  'Inicio',
  'Documentos',
  'Legajos',
  'Personas',
  'Categorías',
  'Prioridades',
] as const;
type Section = (typeof sections)[number];
type Entity = { id: string; [key: string]: unknown };
type DocumentRow = {
  id: string;
  titulo: string;
  numero: string | null;
  tipo: string;
  fechaEmision: string | null;
  fechaIncorporacion: string;
  legajo?: { id: string; numero: string };
  prioridad?: { id: string; nombre: string };
  estado: string;
  personas?: { nombre: string }[];
  categorias?: { nombre: string }[];
  archivos?: { id: string; originalName: string }[];
  descripcion?: string;
};

const api = async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  const token = sessionStorage.getItem('csrf');
  if (token && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(init.method ?? 'GET'))
    headers.set('X-CSRF-Token', token);
  const response = await fetch(`/api${path}`, { ...init, headers, credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
};

function Login({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      if (recovery) {
        await api('/auth/recuperacion', {
          method: 'POST',
          body: JSON.stringify({ email: data.get('email') }),
        });
        setSent(true);
      } else {
        const result = await api<{ token: string }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            identifier: data.get('identifier'),
            password: data.get('password'),
          }),
        });
        sessionStorage.setItem('csrf', result.token);
        onLogin();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    }
  }
  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">N</div>
        <p className="eyebrow">NEXO NOTARIAL</p>
        <h1>{recovery ? 'Recuperá tu acceso.' : 'Tu escribanía, en orden.'}</h1>
        <p className="muted">
          {recovery
            ? 'Te enviaremos un enlace temporal si el correo está registrado.'
            : 'Ingresá para consultar documentos y legajos.'}
        </p>
        {recovery ? (
          <label>
            Correo electrónico
            <input name="email" type="email" autoComplete="email" required />
          </label>
        ) : (
          <>
            <label>
              Usuario o correo
              <input name="identifier" autoComplete="username" required />
            </label>
            <label>
              Contraseña
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
          </>
        )}
        {sent && (
          <p className="success" role="status">
            Si el correo está registrado, recibirás el enlace.
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary full">{recovery ? 'Solicitar enlace' : 'Iniciar sesión'}</button>
        <button
          type="button"
          className="text-button auth-toggle"
          onClick={() => {
            setRecovery(!recovery);
            setSent(false);
            setError('');
          }}
        >
          {recovery ? 'Volver al inicio de sesión' : '¿Olvidaste tu contraseña?'}
        </button>
      </form>
    </main>
  );
}

export function App() {
  const [user, setUser] = useState(false);
  const [section, setSection] = useState<Section>('Inicio');
  const [error, setError] = useState('');
  const loadSession = useCallback(async () => {
    try {
      await api('/auth/me');
      const csrf = await api<{ token: string }>('/auth/csrf');
      sessionStorage.setItem('csrf', csrf.token);
      setUser(true);
    } catch {
      setUser(false);
    }
  }, []);
  useEffect(() => {
    void loadSession();
  }, [loadSession]);
  if (window.location.pathname === '/restablecer') return <ResetPassword />;
  if (!user)
    return (
      <Login
        onLogin={() => {
          setError('');
          void loadSession();
        }}
      />
    );
  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      sessionStorage.removeItem('csrf');
      setUser(false);
    }
  }
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark small">N</span>
          <span>
            Nexo <b>Notarial</b>
          </span>
        </div>
        <p className="nav-label">ESPACIO DE TRABAJO</p>
        <nav>
          {sections.map((item, index) => (
            <button
              key={item}
              className={`nav-item ${section === item ? 'active' : ''}`}
              onClick={() => setSection(item)}
            >
              <span className="nav-icon">{['⌂', '▤', '▣', '♙', '◇', '⚑'][index]}</span>
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">E</span>
            <span>
              <b>Escribano</b>
              <small>Cuenta principal</small>
            </span>
          </div>
          <button className="nav-item logout" onClick={() => void logout()}>
            ↪ <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">GESTIÓN DOCUMENTAL</p>
            <h1>{section}</h1>
          </div>
          <span className="secure-pill">● Sesión protegida</span>
        </header>
        {error && (
          <div className="notice error">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}
        <section className="content">
          {section === 'Inicio' ? (
            <Home navigate={setSection} />
          ) : section === 'Documentos' ? (
            <Documents setError={setError} />
          ) : section === 'Legajos' ? (
            <Legajos setError={setError} />
          ) : section === 'Personas' ? (
            <People setError={setError} />
          ) : section === 'Categorías' ? (
            <Categories setError={setError} />
          ) : (
            <Priorities setError={setError} />
          )}
        </section>
      </main>
    </div>
  );
}

function ResetPassword() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    const token = new URLSearchParams(window.location.search).get('token') ?? '';
    try {
      await api('/auth/restablecer', {
        method: 'POST',
        body: JSON.stringify({ token, password: data.get('password') }),
      });
      setMessage('La contraseña se actualizó. Ya podés ingresar.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar la contraseña.');
    }
  }
  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">N</div>
        <p className="eyebrow">NEXO NOTARIAL</p>
        <h1>Nueva contraseña</h1>
        <label>
          Contraseña nueva
          <input
            name="password"
            type="password"
            minLength={12}
            autoComplete="new-password"
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}
        <button className="primary full">Actualizar contraseña</button>
        <a className="text-button auth-toggle" href="/">
          Volver al inicio
        </a>
      </form>
    </main>
  );
}

function Home({ navigate }: { navigate: (section: Section) => void }) {
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  useEffect(() => {
    void api<{ rows: DocumentRow[] }>('/documentos?page=1&pageSize=6')
      .then((r) => setDocs(r.rows))
      .catch(() => undefined);
  }, []);
  return (
    <>
      <div className="welcome">
        <div>
          <p className="eyebrow">PANEL PRINCIPAL</p>
          <h2>
            Todo lo importante,
            <br />
            <em>a un paso.</em>
          </h2>
          <p>Encontrá y organizá los documentos de tu escribanía.</p>
        </div>
        <div className="welcome-art">✧</div>
      </div>
      <div className="quick-grid">
        <button className="quick-card" onClick={() => navigate('Legajos')}>
          <span>＋</span>
          <b>Crear legajo</b>
          <small>Iniciá un trámite nuevo</small>
        </button>
        <button className="quick-card" onClick={() => navigate('Documentos')}>
          <span>▤</span>
          <b>Ver documentos</b>
          <small>Consultá y encontrá archivos</small>
        </button>
        <button className="quick-card" onClick={() => navigate('Personas')}>
          <span>♙</span>
          <b>Personas</b>
          <small>Contactos relacionados</small>
        </button>
        <button className="quick-card" onClick={() => navigate('Documentos')}>
          <span>⌕</span>
          <b>Buscar</b>
          <small>Buscá por título o número</small>
        </button>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Documentos recientes</h3>
            <p>Acceso rápido a tus últimos registros</p>
          </div>
          <button className="text-button" onClick={() => navigate('Documentos')}>
            Ver todos →
          </button>
        </div>
        <DocumentTable rows={docs.slice(0, 5)} compact />
      </div>
    </>
  );
}

function Documents({ setError }: { setError: (value: string) => void }) {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [legajos, setLegajos] = useState<Entity[]>([]);
  const [priorities, setPriorities] = useState<Entity[]>([]);
  const [categories, setCategories] = useState<Entity[]>([]);
  const [filters, setFilters] = useState({
    estado: '',
    legajoId: '',
    prioridadId: '',
    categoriaId: '',
    fechaDesde: '',
    fechaHasta: '',
    fechaCampo: 'fechaEmision',
    sort: 'fechaIncorporacion',
    direction: 'DESC',
  });
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<DocumentRow | null>(null);
  const refresh = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (query.trim()) params.set('q', query.trim());
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    return api<{ rows: DocumentRow[]; total: number }>(`/documentos?${params.toString()}`)
      .then((r) => {
        setRows(r.rows);
        setTotal(r.total);
      })
      .catch((e) => setError(String(e)));
  }, [filters, page, query, setError]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    void api<Entity[]>('/legajos')
      .then(setLegajos)
      .catch(() => undefined);
    void api<Entity[]>('/prioridades')
      .then(setPriorities)
      .catch(() => undefined);
    void api<Entity[]>('/categorias')
      .then(setCategories)
      .catch(() => undefined);
  }, []);
  function setFilter(name: keyof typeof filters, value: string) {
    setPage(1);
    setFilters((previous) => ({ ...previous, [name]: value }));
  }
  async function remove(row: DocumentRow) {
    if (!window.confirm(`¿Eliminar “${row.titulo}” y sus archivos?`)) return;
    try {
      await api(`/documentos/${row.id}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <>
      <div className="toolbar">
        <div className="search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Buscar por nombre o número…"
          />
        </div>
        <span className="muted result-count">{total} documentos</span>
        <button className="primary" onClick={() => setCreating(true)}>
          ＋ Nuevo documento
        </button>
      </div>
      <div className="filter-bar">
        <select
          aria-label="Filtrar por estado"
          value={filters.estado}
          onChange={(e) => setFilter('estado', e.target.value)}
        >
          <option value="">Todos los estados</option>
          {[
            'Pendiente',
            'En preparación',
            'En revisión',
            'Aprobado',
            'Finalizado',
            'Archivado',
            'Anulado',
          ].map((state) => (
            <option key={state}>{state}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por legajo"
          value={filters.legajoId}
          onChange={(e) => setFilter('legajoId', e.target.value)}
        >
          <option value="">Todos los legajos</option>
          {legajos.map((item) => (
            <option key={item.id} value={item.id}>
              {String(item.numero)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por prioridad"
          value={filters.prioridadId}
          onChange={(e) => setFilter('prioridadId', e.target.value)}
        >
          <option value="">Todas las prioridades</option>
          {priorities.map((item) => (
            <option key={item.id} value={item.id}>
              {String(item.nombre)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por categoría"
          value={filters.categoriaId}
          onChange={(e) => setFilter('categoriaId', e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {String(item.nombre)}
            </option>
          ))}
        </select>
        <select
          aria-label="Fecha a filtrar"
          value={filters.fechaCampo}
          onChange={(e) => setFilter('fechaCampo', e.target.value)}
        >
          <option value="fechaEmision">Fecha de emisión</option>
          <option value="fechaIncorporacion">Fecha de incorporación</option>
        </select>
        <input
          aria-label="Fecha desde"
          type="date"
          value={filters.fechaDesde}
          onChange={(e) => setFilter('fechaDesde', e.target.value)}
        />
        <input
          aria-label="Fecha hasta"
          type="date"
          value={filters.fechaHasta}
          onChange={(e) => setFilter('fechaHasta', e.target.value)}
        />
        <select
          aria-label="Ordenar por"
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value)}
        >
          <option value="fechaIncorporacion">Fecha de incorporación</option>
          <option value="fechaEmision">Fecha de emisión</option>
          <option value="titulo">Nombre</option>
          <option value="numero">Número</option>
          <option value="estado">Estado</option>
          <option value="prioridad">Prioridad</option>
        </select>
        <select
          aria-label="Sentido del orden"
          value={filters.direction}
          onChange={(e) => setFilter('direction', e.target.value)}
        >
          <option value="DESC">Descendente</option>
          <option value="ASC">Ascendente</option>
        </select>
      </div>
      <div className="panel table-panel">
        <DocumentTable rows={rows} onSelect={setSelected} onDelete={remove} />
      </div>
      <div className="pager">
        <span>
          Mostrando {rows.length} de {total}
        </span>
        <div>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Anterior
          </button>
          <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>
            Siguiente →
          </button>
        </div>
      </div>
      {creating && (
        <DocumentForm
          legajos={legajos}
          priorities={priorities}
          onClose={() => setCreating(false)}
          onSave={async (body) => {
            const params = new URLSearchParams({ titulo: String(body.titulo) });
            if (body.numero) params.set('numero', String(body.numero));
            const duplicates = await api<{ titulo: string; numero: string | null }[]>(
              `/documentos/posibles-duplicados?${params}`,
            );
            if (
              duplicates.length &&
              !window.confirm(
                `Hay documentos parecidos: ${duplicates.map((item) => `${item.titulo}${item.numero ? ` (${item.numero})` : ''}`).join(', ')}. ¿Querés continuar igualmente?`,
              )
            )
              return false;
            await api('/documentos', { method: 'POST', body: JSON.stringify(body) });
            setCreating(false);
            await refresh();
            return true;
          }}
        />
      )}
      {selected && <QuickView row={selected} close={() => setSelected(null)} />}
    </>
  );
}

function DocumentTable({
  rows,
  compact = false,
  onSelect,
  onDelete,
}: {
  rows: DocumentRow[];
  compact?: boolean;
  onSelect?: (row: DocumentRow) => void;
  onDelete?: (row: DocumentRow) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {[
              'Nombre o título',
              'Número identificatorio',
              'Categoría',
              'Fecha de emisión',
              'Fecha de incorporación',
              'Legajo',
              'Personas relacionadas',
              'Prioridad',
              'Estado',
            ].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect?.(row)}
                className={onSelect ? 'clickable' : ''}
              >
                <td>
                  <b>{row.titulo}</b>
                  <small className="subline">{row.tipo}</small>
                  {onDelete && (
                    <button
                      className="icon-button row-delete"
                      aria-label="Eliminar documento"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(row);
                      }}
                    >
                      ⌫
                    </button>
                  )}
                </td>
                <td>{row.numero || '—'}</td>
                <td>{row.categorias?.map((c) => c.nombre).join(', ') || '—'}</td>
                <td>{row.fechaEmision || '—'}</td>
                <td>{new Date(row.fechaIncorporacion).toLocaleDateString('es-AR')}</td>
                <td>
                  <span className="case-pill">{row.legajo?.numero ?? '—'}</span>
                </td>
                <td>{row.personas?.map((p) => p.nombre).join(', ') || '—'}</td>
                <td>{row.prioridad?.nombre || '—'}</td>
                <td>
                  <span
                    className={`status status-${row.estado.toLowerCase().replaceAll(' ', '-')}`}
                  >
                    {row.estado}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} className="empty">
                {compact ? 'Todavía no hay documentos.' : 'No hay documentos para mostrar.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DocumentForm({
  legajos,
  priorities,
  onClose,
  onSave,
}: {
  legajos: Entity[];
  priorities: Entity[];
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const saved = await onSave({
        titulo: data.get('titulo'),
        numero: data.get('numero') || null,
        tipo: data.get('tipo'),
        fechaEmision: data.get('fechaEmision') || null,
        descripcion: data.get('descripcion') || null,
        legajoId: data.get('legajoId'),
        prioridadId: data.get('prioridadId'),
      });
      if (saved) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal title="Nuevo documento" onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <label className="span-two">
          Nombre o título
          <input name="titulo" required maxLength={220} />
        </label>
        <label>
          Número identificatorio
          <input name="numero" />
        </label>
        <label>
          Tipo de documento
          <input name="tipo" required placeholder="Escritura, poder, certificado…" />
        </label>
        <label>
          Fecha de emisión
          <input name="fechaEmision" type="date" />
        </label>
        <label>
          Legajo
          <select name="legajoId" required defaultValue="">
            <option value="" disabled>
              Seleccionar legajo
            </option>
            {legajos.map((x) => (
              <option value={x.id} key={x.id}>
                {String(x.numero)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prioridad
          <select name="prioridadId" required defaultValue="">
            <option value="" disabled>
              Seleccionar
            </option>
            {priorities.map((x) => (
              <option value={x.id} key={x.id}>
                {String(x.nombre)}
              </option>
            ))}
          </select>
        </label>
        <label className="span-two">
          Descripción u observaciones
          <textarea name="descripcion" rows={3} />
        </label>
        {error && (
          <p className="error span-two" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions span-two">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar documento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function QuickView({ row, close }: { row: DocumentRow; close: () => void }) {
  const [detail, setDetail] = useState(row);
  const [files, setFiles] = useState(row.archivos ?? []);
  const [error, setError] = useState('');
  const [replaceId, setReplaceId] = useState('');
  const refresh = useCallback(async () => {
    const full = await api<DocumentRow>(`/documentos/${row.id}`);
    setDetail(full);
    setFiles(full.archivos ?? []);
  }, [row.id]);
  useEffect(() => {
    void refresh().catch((e) => setError(String(e)));
  }, [refresh]);
  async function updateStatus(value: string) {
    try {
      await api(`/documentos/${row.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: value }),
      });
      setDetail({ ...detail, estado: value });
    } catch (e) {
      setError(String(e));
    }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('file') as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (
      replaceId &&
      !window.confirm(
        '¿Reemplazar este archivo? El original se eliminará después de guardar el nuevo.',
      )
    )
      return;
    const body = new FormData();
    body.append('archivo', file);
    try {
      await api(`/archivos/documentos/${row.id}/archivos`, { method: 'POST', body });
      if (replaceId) await api(`/archivos/${replaceId}`, { method: 'DELETE' });
      setReplaceId('');
      input.value = '';
      await refresh();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo incorporar el archivo.');
    }
  }
  async function removeFile(fileId: string) {
    if (!window.confirm('¿Eliminar definitivamente este archivo adjunto?')) return;
    try {
      await api(`/archivos/${fileId}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <Modal title="Vista rápida" onClose={close}>
      <div className="quickview">
        <p className="eyebrow">LEGAJO {detail.legajo?.numero ?? '—'}</p>
        <h2>{detail.titulo}</h2>
        <dl>
          <dt>Número</dt>
          <dd>{detail.numero ?? '—'}</dd>
          <dt>Tipo</dt>
          <dd>{detail.tipo}</dd>
          <dt>Estado</dt>
          <dd>
            <select value={detail.estado} onChange={(e) => void updateStatus(e.target.value)}>
              {[
                'Pendiente',
                'En preparación',
                'En revisión',
                'Aprobado',
                'Finalizado',
                'Archivado',
                'Anulado',
              ].map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          </dd>
          <dt>Prioridad</dt>
          <dd>{detail.prioridad?.nombre ?? '—'}</dd>
          <dt>Personas</dt>
          <dd>{detail.personas?.map((p) => p.nombre).join(', ') || '—'}</dd>
          <dt>Descripción</dt>
          <dd>{detail.descripcion || 'Sin descripción.'}</dd>
        </dl>
        <h3>Archivos digitales</h3>
        {files.map((file) => (
          <div className="file-row" key={file.id}>
            <span>{file.originalName}</span>
            <div>
              <button
                className="text-button"
                onClick={() =>
                  window.open(`/api/archivos/${file.id}/vista-previa`, '_blank', 'noopener')
                }
              >
                Vista previa
              </button>
              <button className="text-button" onClick={() => setReplaceId(file.id)}>
                Reemplazar
              </button>
              <button
                className="icon-button"
                aria-label={`Eliminar ${file.originalName}`}
                onClick={() => void removeFile(file.id)}
              >
                ⌫
              </button>
            </div>
          </div>
        ))}
        {!files.length && <p className="muted">Aún no hay archivos adjuntos.</p>}
        <form className="upload-form" onSubmit={upload}>
          <label>
            {replaceId ? 'Seleccioná el archivo nuevo para reemplazar' : 'Agregar archivo'}
            <input
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              required
            />
          </label>
          {replaceId && (
            <button type="button" className="secondary" onClick={() => setReplaceId('')}>
              Cancelar reemplazo
            </button>
          )}
          <button className="primary">
            {replaceId ? 'Reemplazar archivo' : 'Incorporar archivo'}
          </button>
        </form>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <p className="muted">Vista rápida y consulta de archivos.</p>
      </div>
    </Modal>
  );
}

function Legajos({ setError }: { setError: (value: string) => void }) {
  const [rows, setRows] = useState<Entity[]>([]);
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(
    () =>
      api<Entity[]>('/legajos')
        .then(setRows)
        .catch((e) => setError(String(e))),
    [setError],
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function add(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await api('/legajos', { method: 'POST', body: JSON.stringify({ numero }) });
      setNumero('');
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }
  async function remove(row: Entity) {
    if (
      !window.confirm(
        `¿Eliminar el legajo ${String(row.numero)} y todos sus documentos relacionados?`,
      )
    )
      return;
    try {
      await api(`/legajos/${row.id}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Legajos</h2>
          <p>Cada legajo reúne los documentos de un trámite.</p>
        </div>
        <form className="inline-form" onSubmit={add}>
          <input
            aria-label="Número de legajo"
            placeholder="Número de legajo"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
          />
          <button className="primary" disabled={loading}>
            ＋ Crear legajo
          </button>
        </form>
      </div>
      <div className="card-list">
        {rows.map((row) => (
          <article className="entity-card" key={row.id}>
            <div className="case-icon">▣</div>
            <div className="entity-info">
              <b>Legajo {String(row.numero)}</b>
              <small>
                {Array.isArray(row.documentos) ? row.documentos.length : 0} documentos asociados
              </small>
            </div>
            <button
              className="icon-button"
              aria-label={`Eliminar legajo ${String(row.numero)}`}
              onClick={() => void remove(row)}
            >
              ⌫
            </button>
          </article>
        ))}
        {!rows.length && (
          <div className="panel empty">Todavía no hay legajos. Creá uno para comenzar.</div>
        )}
      </div>
    </>
  );
}

function People({ setError }: { setError: (value: string) => void }) {
  const [rows, setRows] = useState<Entity[]>([]);
  const [name, setName] = useState('');
  const refresh = useCallback(
    () =>
      api<Entity[]>('/personas')
        .then(setRows)
        .catch((e) => setError(String(e))),
    [setError],
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function add(e: FormEvent) {
    e.preventDefault();
    try {
      await api('/personas', { method: 'POST', body: JSON.stringify({ nombre: name }) });
      setName('');
      await refresh();
    } catch (x) {
      setError(String(x));
    }
  }
  async function remove(row: Entity) {
    if (!window.confirm(`¿Eliminar a ${String(row.nombre)} de las personas?`)) return;
    try {
      await api(`/personas/${row.id}`, { method: 'DELETE' });
      await refresh();
    } catch (x) {
      setError(String(x));
    }
  }
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Personas</h2>
          <p>Registros reutilizables relacionados con documentos.</p>
        </div>
        <form className="inline-form" onSubmit={add}>
          <input
            placeholder="Nombre y apellido o razón social"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button className="primary">＋ Agregar persona</button>
        </form>
      </div>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Nombre / razón social</th>
              <th>DNI, CUIT o CUIL</th>
              <th>Correo electrónico</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <b>{String(row.nombre)}</b>
                </td>
                <td>{String(row.identificacion ?? '—')}</td>
                <td>{String(row.email ?? '—')}</td>
                <td>
                  <button
                    className="icon-button"
                    onClick={() => void remove(row)}
                    aria-label="Eliminar persona"
                  >
                    ⌫
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="empty">
                  No hay personas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Categories({ setError }: { setError: (value: string) => void }) {
  const [rows, setRows] = useState<Entity[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const refresh = useCallback(
    () =>
      api<Entity[]>('/categorias')
        .then(setRows)
        .catch((e) => setError(String(e))),
    [setError],
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function add(e: FormEvent) {
    e.preventDefault();
    try {
      await api('/categorias', {
        method: 'POST',
        body: JSON.stringify({ nombre: name, parentId: parentId || null }),
      });
      setName('');
      setParentId('');
      await refresh();
    } catch (x) {
      setError(String(x));
    }
  }
  async function remove(row: Entity) {
    if (!window.confirm(`¿Eliminar la categoría ${String(row.nombre)}?`)) return;
    try {
      await api(`/categorias/${row.id}`, { method: 'DELETE' });
      await refresh();
    } catch (x) {
      setError(String(x));
    }
  }
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Categorías</h2>
          <p>Clasificá documentos con categorías y subcategorías.</p>
        </div>
      </div>
      <form className="inline-form panel form-panel" onSubmit={add}>
        <input
          placeholder="Nombre de categoría"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select
          aria-label="Categoría padre"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">Categoría principal</option>
          {rows
            .filter((r) => !r.parentId)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {String(r.nombre)}
              </option>
            ))}
        </select>
        <button className="primary">＋ Agregar</button>
      </form>
      <div className="card-list">
        {rows.map((row) => (
          <article className="entity-card" key={row.id}>
            <div className="case-icon">◇</div>
            <div className="entity-info">
              <b>{String(row.nombre)}</b>
              <small>
                {row.parentId
                  ? `Subcategoría de ${rows.find((r) => r.id === row.parentId)?.nombre ?? ''}`
                  : 'Categoría principal'}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label="Eliminar categoría"
              onClick={() => void remove(row)}
            >
              ⌫
            </button>
          </article>
        ))}
        {!rows.length && <div className="panel empty">No hay categorías. Agregá la primera.</div>}
      </div>
    </>
  );
}

function Priorities({ setError }: { setError: (value: string) => void }) {
  const [rows, setRows] = useState<Entity[]>([]);
  const [dirty, setDirty] = useState(false);
  const refresh = useCallback(
    () =>
      api<Entity[]>('/prioridades')
        .then(setRows)
        .catch((e) => setError(String(e))),
    [setError],
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  function change(index: number, key: string, value: string | number) {
    setRows((previous) => previous.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
    setDirty(true);
  }
  function move(index: number, delta: number) {
    const next = [...rows];
    const other = index + delta;
    if (other < 0 || other >= next.length) return;
    [next[index], next[other]] = [next[other], next[index]];
    setRows(next.map((r, i) => ({ ...r, orden: i + 1 })));
    setDirty(true);
  }
  async function save() {
    try {
      await api('/prioridades', {
        method: 'PUT',
        body: JSON.stringify(rows.map((r, i) => ({ id: r.id, nombre: r.nombre, orden: i + 1 }))),
      });
      setDirty(false);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <>
      <div className="section-intro">
        <div>
          <h2>Prioridades</h2>
          <p>Los cinco niveles se pueden renombrar y ordenar.</p>
        </div>
        <button className="primary" disabled={!dirty} onClick={() => void save()}>
          Guardar cambios
        </button>
      </div>
      <div className="priority-list">
        {rows.map((row, index) => (
          <div className="priority-row" key={row.id}>
            <span className={`priority-dot p${index + 1}`}></span>
            <input
              value={String(row.nombre)}
              onChange={(e) => change(index, 'nombre', e.target.value)}
              aria-label={`Nombre prioridad ${index + 1}`}
            />
            <span className="priority-level">Nivel {index + 1}</span>
            <button
              className="icon-button"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              aria-label="Subir prioridad"
            >
              ↑
            </button>
            <button
              className="icon-button"
              disabled={index === rows.length - 1}
              onClick={() => move(index, 1)}
              aria-label="Bajar prioridad"
            >
              ↓
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
