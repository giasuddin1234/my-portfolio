/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Menu, X, MapPin, Mail, GraduationCap, LineChart, BookOpen, 
  Settings, LogIn, LayoutDashboard, Send, ExternalLink,
  Github, Linkedin, Facebook, Trash2, Plus, Edit2, Save,
  CheckCircle2, AlertCircle, Phone, Globe, LogOut, User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logOut, db, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  doc, onSnapshot, updateDoc, setDoc, collection, addDoc, 
  deleteDoc, query, orderBy, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { Profile, Skill, Project, Education, ContactInfo, Message } from './types';

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'portfolio' | 'admin'>('portfolio');
  const [loadingUser, setLoadingUser] = useState(true);

  // Data State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [education, setEducation] = useState<Education[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Hardcoded admin email per instructions/rules
      setIsAdmin(u?.email === 'giasuddinpadua2020@gmail.com' && u?.emailVerified === true);
      setLoadingUser(false);
    });
    return unsub;
  }, []);

  // Sync Global Data
  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, 'settings', 'profile'), (snap) => {
      if (snap.exists()) setProfile(snap.data() as Profile);
    });
    const unsubContact = onSnapshot(doc(db, 'settings', 'contact'), (snap) => {
      if (snap.exists()) setContactInfo(snap.data() as ContactInfo);
    });
    const unsubSkills = onSnapshot(query(collection(db, 'skills')), (snap) => {
      setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() } as Skill)));
    });
    const unsubProjects = onSnapshot(query(collection(db, 'projects'), orderBy('order', 'asc')), (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    }, (err) => console.error("Project access err:", err));
    const unsubEdu = onSnapshot(query(collection(db, 'education'), orderBy('order', 'asc')), (snap) => {
      setEducation(snap.docs.map(d => ({ id: d.id, ...d.data() } as Education)));
    });

    return () => {
      unsubProfile(); unsubContact(); unsubSkills(); unsubProjects(); unsubEdu();
    };
  }, []);

  const toggleView = () => setView(view === 'portfolio' ? 'admin' : 'portfolio');

  if (loadingUser) return <div className="min-h-screen flex items-center justify-center bg-white text-navy font-display text-4xl animate-pulse">G.</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* View Switcher/Admin Login Trigger */}
      <div className="fixed bottom-6 right-6 z-[100]">
        {!user ? (
          <button 
            onClick={signInWithGoogle}
            className="w-12 h-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-lg group"
            title="Admin Login"
          >
            <LogIn size={20} />
          </button>
        ) : isAdmin ? (
          <button 
            onClick={toggleView}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${view === 'admin' ? 'bg-navy text-white' : 'bg-blue-600 text-white'}`}
            title={view === 'admin' ? "Go to Portfolio" : "Go to Dashboard"}
          >
            {view === 'admin' ? <Globe size={24} /> : <Settings size={24} />}
          </button>
        ) : (
          <button 
            onClick={logOut}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 border border-red-100 shadow-lg hover:bg-red-50"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'portfolio' ? (
          <PortfolioView 
            profile={profile} 
            contactInfo={contactInfo} 
            skills={skills} 
            projects={projects} 
            education={education} 
          />
        ) : (
          <AdminView 
            profile={profile} 
            contactInfo={contactInfo} 
            skills={skills} 
            projects={projects} 
            education={education}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- PORTFOLIO VIEW ---
function PortfolioView({ profile, contactInfo, skills, projects, education }: any) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Placeholder data if DB is empty
  const defaultProfile = { 
    name: "New Creator", 
    title: "Portfolio Ready", 
    bio: "Head to the dashboard to customize your portfolio. Add your research interests, projects, and achievements to see them appear here in real-time."
  };
  
  const p = profile || defaultProfile;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${navScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <a href="#" className="font-display font-bold text-2xl text-navy">
            {p.name.split(' ')[0]}<span className="text-blue-600">.</span>
          </a>
          <div className="hidden md:flex gap-10">
            {['About', 'Skills', 'Projects', 'Education', 'Contact'].map(s => (
              <a key={s} href={`#${s.toLowerCase()}`} className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">{s}</a>
            ))}
          </div>
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="md:hidden bg-white border-b border-slate-100 overflow-hidden">
               <div className="p-6 flex flex-col gap-4">
                  {['About', 'Skills', 'Projects', 'Education', 'Contact'].map(s => (
                    <a key={s} href={`#${s.toLowerCase()}`} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-navy">{s}</a>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-20 px-6 relative overflow-hidden bg-slate-50">
        <div className="absolute top-20 right-[5%] w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
           <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ duration: 0.8 }}>
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 italic">Welcome to my space</div>
              <h1 className="text-6xl md:text-8xl font-display font-bold text-navy leading-[0.9] mb-8">{p.name}</h1>
              <p className="text-xl text-slate-500 max-w-md font-medium mb-10 leading-relaxed italic">"{p.title}" — {p.bio.substring(0, 100)}...</p>
              <div className="flex gap-4">
                <a href="#projects" className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold shadow-xl shadow-blue-200 hover:bg-navy hover:shadow-none transition-all active:scale-95">View Projects</a>
                <a href="#contact" className="px-8 py-4 border-2 border-slate-200 text-navy font-bold rounded-full hover:border-blue-600 hover:text-blue-600 transition-all active:scale-95">Say Hello</a>
              </div>
           </motion.div>
           <div className="flex justify-center relative">
              <div className="w-80 h-[480px] bg-slate-200 rounded-[4rem] overflow-hidden shadow-2xl relative z-10">
                 {p.photoUrl ? (
                   <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-400 font-display text-9xl">{p.name?.[0]}</div>
                 )}
              </div>
              <div className="absolute -bottom-8 -right-8 w-64 h-64 border-4 border-gold rounded-[4rem] -z-10" />
           </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-blue-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">The Story</span>
          </div>
          <h2 className="text-4xl font-display font-bold text-navy mb-8">About Me</h2>
          <div className="text-lg text-slate-600 leading-loose space-y-6">
            <p className="whitespace-pre-line">{p.bio}</p>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section id="skills" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-8 h-[2px] bg-blue-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Know-how</span>
              </div>
              <h2 className="text-4xl font-display font-bold text-navy mb-6 leading-tight">My Expertise & Toolkit</h2>
              <p className="text-sm text-slate-400 font-medium">A diverse range of skills tailored for economic research and strategic development.</p>
            </div>
            <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-tighter mb-4">{s.category || 'General'}</div>
                  <h4 className="text-xl font-bold text-navy mb-6">{s.name}</h4>
                  <div className="h-[2px] w-full bg-slate-100 rounded-full relative">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.proficiency}%` }} viewport={{ once:true }} transition={{ duration: 1.5 }} className="absolute h-full bg-blue-600" />
                  </div>
                  <div className="mt-2 text-right text-[10px] font-black text-slate-300 uppercase tracking-widest">{s.proficiency}% Mastery</div>
                </div>
              ))}
              {skills.length === 0 && <p className="text-slate-300 italic">No skills added yet.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-4 justify-center">
              <div className="w-8 h-[2px] bg-blue-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Showcase</span>
              <div className="w-8 h-[2px] bg-blue-600" />
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-navy">Featured Work</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {projects.map((proj, idx) => (
              <motion.div key={proj.id} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: idx * 0.1 }} className="group">
                <div className="aspect-[16/10] bg-slate-100 rounded-[3rem] overflow-hidden mb-8 relative">
                   {proj.imageUrl ? (
                     <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <LineChart size={64} />
                     </div>
                   )}
                   <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        {proj.liveUrl && <a href={proj.liveUrl} target="_blank" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-navy hover:text-blue-600 shadow-lg"><ExternalLink size={18} /></a>}
                        {proj.repoUrl && <a href={proj.repoUrl} target="_blank" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-navy hover:text-blue-600 shadow-lg"><Github size={18} /></a>}
                      </div>
                   </div>
                </div>
                <div className="flex gap-4 mb-4 flex-wrap">
                  {proj.tags?.map(t => <span key={t} className="text-[10px] font-black uppercase tracking-widest text-slate-400"># {t}</span>)}
                </div>
                <h3 className="text-2xl font-display font-bold text-navy mb-4">{proj.title}</h3>
                <p className="text-slate-500 leading-relaxed italic">{proj.description}</p>
              </motion.div>
            ))}
            {projects.length === 0 && <p className="text-slate-300 italic col-span-full text-center">No projects in the list.</p>}
          </div>
        </div>
      </section>

      {/* Education */}
      <section id="education" className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Trajectory</span>
          </div>
          <h2 className="text-4xl font-display font-bold mb-16">Academic Journey</h2>
          <div className="space-y-16 pl-8 border-l border-white/10 relative">
            {education.map(edu => (
              <div key={edu.id} className="relative">
                <div className="absolute -left-[37px] top-1.5 w-3 h-3 bg-blue-500 rounded-full" />
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 italic">{edu.period}</div>
                <h4 className="text-2xl font-display font-bold mb-2">{edu.school}</h4>
                <div className="text-lg font-medium text-slate-400 mb-6">{edu.degree}</div>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xl">{edu.description}</p>
              </div>
            ))}
            {education.length === 0 && <p className="text-slate-600 italic">History is yet to be written.</p>}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
           <div>
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-8 h-[2px] bg-blue-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Connect</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-navy mb-8">Let's talk about the next big thing.</h2>
              <div className="space-y-6">
                {contactInfo?.email && (
                  <div className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100 group">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Mail size={20} /></div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-slate-400">Email Me</div>
                      <div className="text-lg font-bold text-navy">{contactInfo.email}</div>
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  {contactInfo?.linkedin && <a href={contactInfo.linkedin} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 border border-slate-100 transition-all"><Linkedin size={20} /></a>}
                  {contactInfo?.facebook && <a href={contactInfo.facebook} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 border border-slate-100 transition-all"><Facebook size={20} /></a>}
                  {contactInfo?.github && <a href={contactInfo.github} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 border border-slate-100 transition-all"><Github size={20} /></a>}
                </div>
              </div>
           </div>
           <div className="bg-navy p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <ContactForm />
           </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100 text-center">
         <div className="font-display font-bold text-2xl text-navy mb-2">Gias<span className="text-blue-600">.</span></div>
         <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.3em]">Economics & Development Research</p>
      </footer>
    </motion.div>
  );
}

// --- SUBCOMPONENTS ---
function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', content: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: any) => {
     e.preventDefault();
     setStatus('sending');
     try {
       await addDoc(collection(db, 'messages'), {
         ...formData,
         createdAt: serverTimestamp()
       });
       setStatus('success');
       setFormData({ name: '', email: '', content: '' });
       setTimeout(() => setStatus('idle'), 5000);
     } catch (err) {
       console.error(err);
       setStatus('error');
     }
  };

  return (
    <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Your Name</label>
        <input 
          required 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          type="text" 
          placeholder="E.g. Ahmed" 
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium" 
        />
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label>
        <input 
          required 
          value={formData.email} 
          onChange={e => setFormData({...formData, email: e.target.value})} 
          type="email" 
          placeholder="E.g. ahmed@mail.com" 
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium" 
        />
      </div>
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tell me something</label>
        <textarea 
          required 
          rows={5} 
          value={formData.content} 
          onChange={e => setFormData({...formData, content: e.target.value})} 
          placeholder="I'm interested in your research..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium resize-none"
        ></textarea>
      </div>
      <button 
        disabled={status === 'sending'} 
        className="w-full bg-blue-600 text-white font-bold py-5 rounded-fill rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/30 active:scale-95 disabled:opacity-50"
      >
        {status === 'sending' ? 'Transmitting...' : status === 'success' ? 'Message Sent' : 'Collaborate With Me'}
      </button>
      {status === 'success' && <p className="text-green-400 text-center text-xs font-bold animate-pulse">Succcess! Your message has been sent.</p>}
      {status === 'error' && <p className="text-red-400 text-center text-xs font-bold">Failed to send. Please try again.</p>}
    </form>
  )
}

// --- ADMIN DASHBOARD VIEW ---
function AdminView({ profile, contactInfo, skills, projects, education }: any) {
  const [activeTab, setActiveTab] = useState<'profile' | 'skills' | 'projects' | 'education' | 'messages'>('profile');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), (snap) => {
       setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
    return unsub;
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-slate-50 pt-24 pb-12 px-6">
       <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
          {/* Sidebar Nav */}
          <div className="lg:w-64 space-y-2">
             <div className="px-4 py-8 bg-navy rounded-3xl mb-8 text-white">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Signed in as</div>
                <div className="font-bold truncate">{auth.currentUser?.email}</div>
             </div>
             {[
               { id: 'profile', icon: UserIcon, label: 'Profile' },
               { id: 'skills', icon: LineChart, label: 'Skills' },
               { id: 'projects', icon: BookOpen, label: 'Projects' },
               { id: 'education', icon: GraduationCap, label: 'Education' },
               { id: 'messages', icon: Mail, label: 'Messages' },
             ].map(t => (
               <button 
                 key={t.id} 
                 onClick={() => setActiveTab(t.id as any)}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200 hover:text-navy'}`}
               >
                 <t.icon size={18} />
                 <span>{t.label}</span>
               </button>
             ))}
          </div>

          {/* Main Panel */}
          <div className="flex-1 bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-sm overflow-hidden">
             {activeTab === 'profile' && <ProfileManager profile={profile} contactInfo={contactInfo} />}
             {activeTab === 'skills' && <CollectionManager type="skills" items={skills} schema={['name', 'category', 'proficiency']} />}
             {activeTab === 'projects' && <CollectionManager type="projects" items={projects} schema={['title', 'description', 'imageUrl', 'liveUrl', 'repoUrl', 'order']} />}
             {activeTab === 'education' && <CollectionManager type="education" items={education} schema={['school', 'degree', 'period', 'description', 'order']} />}
             {activeTab === 'messages' && <MessageViewer messages={messages} />}
          </div>
       </div>
    </motion.div>
  );
}

function ProfileManager({ profile, contactInfo }: any) {
  const [p, setP] = useState<Profile>(profile || { name: '', title: '', bio: '', photoUrl: '', cvUrl: '' });
  const [c, setC] = useState<ContactInfo>(contactInfo || { email: '', phone: '', location: '', facebook: '', linkedin: '', github: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: any) => {
     e.preventDefault();
     setSaving(true);
     try {
       await setDoc(doc(db, 'settings', 'profile'), p);
       await setDoc(doc(db, 'settings', 'contact'), c);
       alert('Profile updated successfully!');
     } catch (err) { handleFirestoreError(err, 'write'); }
     setSaving(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-12">
      <div className="flex justify-between items-center mb-8">
         <h2 className="text-3xl font-display font-bold text-navy">Corporate Identity</h2>
         <button type="submit" disabled={saving} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-navy transition-all active:scale-95">
           {saving ? 'Saving...' : <><Save size={18} /> Save All Changes</>}
         </button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <section className="space-y-6">
           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Primary Info</h4>
           <AdminInput label="Full Name" value={p.name} onChange={v => setP({...p, name:v})} />
           <AdminInput label="Professional Headline" value={p.title} onChange={v => setP({...p, title:v})} />
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Biography</label>
              <textarea 
                value={p.bio} 
                onChange={e => setP({...p, bio: e.target.value})} 
                rows={5} 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-medium text-sm"
              ></textarea>
           </div>
           <AdminInput label="Photo URL" value={p.photoUrl || ''} onChange={v => setP({...p, photoUrl:v})} />
        </section>

        <section className="space-y-6">
           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Reach & Socials</h4>
           <AdminInput label="Primary Email" value={c.email} onChange={v => setC({...c, email:v})} />
           <AdminInput label="Phone" value={c.phone || ''} onChange={v => setC({...c, phone:v})} />
           <AdminInput label="Location" value={c.location || ''} onChange={v => setC({...c, location:v})} />
           <AdminInput label="LinkedIn URL" value={c.linkedin || ''} onChange={v => setC({...c, linkedin:v})} />
           <AdminInput label="GitHub Profile" value={c.github || ''} onChange={v => setC({...c, github:v})} />
           <AdminInput label="Facebook URL" value={c.facebook || ''} onChange={v => setC({...c, facebook:v})} />
        </section>
      </div>
    </form>
  )
}

function CollectionManager({ type, items, schema }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});

  const startEdit = (item: any) => {
     setEditingId(item.id);
     setDraft(item);
  };

  const startNew = () => {
     setEditingId('new');
     const newDraft: any = {};
     schema.forEach((k:string) => newDraft[k] = k === 'order' || k === 'proficiency' ? 0 : '');
     if (type === 'projects') newDraft.tags = [];
     setDraft(newDraft);
  };

  const handleSave = async () => {
    try {
      if (editingId === 'new') {
        const { id, ...data } = draft;
        await addDoc(collection(db, type), data);
      } else {
        const { id, ...data } = draft;
        await updateDoc(doc(db, type, editingId!), data);
      }
      setEditingId(null);
    } catch (err) { handleFirestoreError(err, 'write'); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this entry?")) return;
    try {
      await deleteDoc(doc(db, type, id));
    } catch (err) { handleFirestoreError(err, 'delete'); }
  };

  return (
    <div className="space-y-12">
       <div className="flex justify-between items-center mb-8">
         <h2 className="text-3xl font-display font-bold text-navy capitalize">{type}</h2>
         <button onClick={startNew} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-navy transition-all active:scale-95">
           <Plus size={18} /> Add New
         </button>
      </div>

      <div className="space-y-4">
         {items.map((item: any) => (
           <div key={item.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
              <div className="flex-1 overflow-hidden">
                 <div className="text-lg font-bold text-navy mb-1 truncate">{Object.values(item)[1] || 'No Title'}</div>
                 <div className="text-xs text-slate-400 font-medium truncate">{Object.values(item)[2] || ''}</div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"><Edit2 size={18} /></button>
                 <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"><Trash2 size={18} /></button>
              </div>
           </div>
         ))}
         {items.length === 0 && <p className="text-slate-300 italic text-center py-12">Empty collection. Start adding data.</p>}
      </div>

      <AnimatePresence>
         {editingId && (
           <div className="fixed inset-0 z-[200] bg-navy/20 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }} className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[80vh] overflow-y-auto p-12 shadow-2xl relative">
                 <button onClick={() => setEditingId(null)} className="absolute top-8 right-8 text-slate-300 hover:text-navy"><X size={28} /></button>
                 <h3 className="text-2xl font-bold text-navy mb-8 capitalize">{editingId === 'new' ? 'Create' : 'Edit'} {type.slice(0,-1)}</h3>
                 <div className="space-y-6">
                    {schema.map((key: string) => (
                       <div key={key}>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">{key}</label>
                          {key === 'description' || key === 'bio' ? (
                            <textarea value={draft[key]} onChange={e => setDraft({...draft, [key]: e.target.value})} rows={4} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"></textarea>
                          ) : key === 'order' || key === 'proficiency' ? (
                             <input type="number" value={draft[key]} onChange={e => setDraft({...draft, [key]: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3" />
                          ) : (
                             <input type="text" value={draft[key]} onChange={e => setDraft({...draft, [key]: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3" />
                          )}
                       </div>
                    ))}
                    {type === 'projects' && (
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Tags (comma separated)</label>
                          <input type="text" value={draft.tags?.join(', ')} onChange={e => setDraft({...draft, tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3" />
                       </div>
                    )}
                 </div>
                 <div className="mt-12 flex gap-4">
                    <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-navy shadow-lg transition-all">Save Changes</button>
                    <button onClick={() => setEditingId(null)} className="px-8 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all font-bold">Cancel</button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  )
}

function MessageViewer({ messages }: { messages: Message[] }) {
  const handleDelete = async (id: string) => {
     if(!confirm("Delete this message?")) return;
     try { await deleteDoc(doc(db, 'messages', id)); } catch(err) { handleFirestoreError(err, 'delete'); }
  };
  return (
    <div className="space-y-8">
       <h2 className="text-3xl font-display font-bold text-navy">Inbox</h2>
       <div className="space-y-6">
          {messages.map(m => (
            <div key={m.id} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 relative group">
               <button onClick={() => handleDelete(m.id)} className="absolute top-6 right-6 p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Mail size={18} /></div>
                  <div>
                    <div className="font-bold text-navy leading-tight">{m.name}</div>
                    <div className="text-xs font-medium text-slate-400">{m.email} · {m.createdAt?.toDate().toLocaleDateString()}</div>
                  </div>
               </div>
               <div className="text-sm text-slate-600 leading-relaxed italic">"{m.content}"</div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-slate-300 italic py-12 text-center">Inbox is quiet.</p>}
       </div>
    </div>
  )
}

function AdminInput({ label, value, onChange }: { label: string, value: string, onChange: (v:string)=>void }) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-medium text-sm" 
      />
    </div>
  )
}
