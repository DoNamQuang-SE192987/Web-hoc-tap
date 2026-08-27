'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { playSound } from '@/lib/sound';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Flame, LogOut, Plus, Star, Folder, AlertCircle, Clock, CheckCircle, Volume2, X, ChevronLeft, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';

interface Deck {
  id: string;
  name: string;
  description: string;
  language: string;
  isPublic: boolean;
  cardCount: number;
  imageUrl?: string;
}

interface CardType {
  id: string;
  deckId?: string;
  front: string;
  back: string;
  exampleSentence?: string;
  pronunciation?: string;
}

const topicMetadata: Record<string, { vnName: string, icon: string, image: string }> = {
  'Schools': { vnName: 'Trường học', icon: '🏫', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&auto=format&fit=crop&q=60' },
  'Examination': { vnName: 'Kỳ thi', icon: '📝', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&auto=format&fit=crop&q=60' },
  'Extracurricular Activities': { vnName: 'Hoạt động ngoại khóa', icon: '⚽', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&auto=format&fit=crop&q=60' },
  'School Stationery': { vnName: 'Dụng cụ học tập', icon: '✏️', image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=300&auto=format&fit=crop&q=60' },
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [publicDecks, setPublicDecks] = useState<Deck[]>([]);
  const [dueCardsCount, setDueCardsCount] = useState<number>(0);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [newDeckLang, setNewDeckLang] = useState('English');
  const [newDeckPublic, setNewDeckPublic] = useState(false);
  const [newDeckImageUrl, setNewDeckImageUrl] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckCards, setDeckCards] = useState<CardType[]>([]);
  const [learnedCards, setLearnedCards] = useState<CardType[]>([]);
  
  // States for adding card
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [example, setExample] = useState('');

  // States for Admin editing card
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editPronunciation, setEditPronunciation] = useState('');
  const [editExample, setEditExample] = useState('');
  const [isEditingCardDialogOpen, setIsEditingCardDialogOpen] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);

  // States for countdown (Golden Time 30-min alert)
  const [goldenTimeLeft, setGoldenTimeLeft] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('review');

  // Dialog controlled open states
  const [isExploreDeckDialogOpen, setIsExploreDeckDialogOpen] = useState(false);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);

  // States for learning session inside explore tab
  const [viewingExploreDeck, setViewingExploreDeck] = useState<Deck | null>(null);
  const [studySession, setStudySession] = useState<boolean>(false);
  const [learningIndex, setLearningIndex] = useState<number>(0);
  const [learningStep, setLearningStep] = useState<'preview' | 'answer' | 'dictation' | 'fillBlank'>('preview');
  
  // dictation step states
  const [dictationInput, setDictationInput] = useState<string>('');
  const [dictationSubmitted, setDictationSubmitted] = useState<boolean>(false);
  const [dictationCorrect, setDictationCorrect] = useState<boolean>(false);

  // fillBlank step states
  const [fillBlankInput, setFillBlankInput] = useState<string>('');
  const [fillBlankSubmitted, setFillBlankSubmitted] = useState<boolean>(false);
  const [fillBlankCorrect, setFillBlankCorrect] = useState<boolean>(false);

  // state to track failed words for re-studying at the end
  const [failedCardIds, setFailedCardIds] = useState<string[]>([]);
  const [isRetryPhase, setIsRetryPhase] = useState<boolean>(false);

  // User Settings states (timezone, notifyTime)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notifyTime, setNotifyTime] = useState('08:30');
  const [timezone, setTimezone] = useState('GMT+7');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';

  // Load User and Decks
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.notifyTime) {
        setNotifyTime(parsedUser.notifyTime.substring(0, 5));
      }
      if (parsedUser.timezone) {
        setTimezone(parsedUser.timezone);
      }

      fetchData();
    }
  }, []);

  // Golden Time countdown simulator (for demo purposes)
  useEffect(() => {
    const lastSession = localStorage.getItem('last_session_time');
    if (lastSession) {
      const interval = setInterval(() => {
        const diff = 30 * 60 * 1000 - (Date.now() - parseInt(lastSession));
        if (diff > 0) {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setGoldenTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        } else {
          setGoldenTimeLeft(null);
          fetchData();
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [dueCardsCount]);

  const fetchData = async () => {
    try {
      const [userRes, decksRes, dueRes, learnedRes] = await Promise.allSettled([
        api.get<any, any>('/api/users/me'),
        api.get<any, any>('/api/decks'),
        api.get<any, any>('/api/decks/due'),
        api.get<any, any>('/api/decks/learned')
      ]);

      if (userRes.status === 'fulfilled') {
        const val: any = userRes.value;
        if (val?.success && val?.data) {
          const userData = val.data;
          setUser(userData);
          if (userData.notifyTime) {
            setNotifyTime(userData.notifyTime.substring(0, 5));
          }
          if (userData.timezone) {
            setTimezone(userData.timezone);
          }
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }

      if (decksRes.status === 'fulfilled') {
        const val: any = decksRes.value;
        if (val?.success && Array.isArray(val?.data)) {
          setDecks(val.data.filter((d: Deck) => !d.isPublic));
          setPublicDecks(val.data.filter((d: Deck) => d.isPublic));
        }
      }

      if (dueRes.status === 'fulfilled') {
        const val: any = dueRes.value;
        if (val?.success && Array.isArray(val?.data)) {
          setDueCardsCount(val.data.length);
        }
      }

      if (learnedRes.status === 'fulfilled') {
        const val: any = learnedRes.value;
        if (val?.success && Array.isArray(val?.data)) {
          setLearnedCards(val.data.map((c: any) => ({
            id: c.cardId,
            deckId: c.deckId,
            front: c.front,
            back: c.back,
            pronunciation: c.pronunciation || '',
            exampleSentence: c.exampleSentence || ''
          })));
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent, isPublicForced?: boolean) => {
    e.preventDefault();
    if (!newDeckName.trim()) {
      alert('Vui lòng nhập tên chủ đề!');
      return;
    }

    setIsCreatingDeck(true);
    try {
      const isPublic = isPublicForced !== undefined ? isPublicForced : newDeckPublic;
      const res: any = await api.post('/api/decks', {
        name: newDeckName.trim(),
        description: newDeckDesc.trim(),
        language: newDeckLang,
        isPublic: isPublic,
        imageUrl: newDeckImageUrl?.trim() || undefined
      });

      if (res.success && res.data) {
        // Cập nhật ngay vào danh sách hiển thị
        if (isPublic) {
          setPublicDecks(prev => [res.data, ...prev.filter(d => d.id !== res.data.id)]);
        } else {
          setDecks(prev => [res.data, ...prev.filter(d => d.id !== res.data.id)]);
        }

        setNewDeckName('');
        setNewDeckDesc('');
        setNewDeckImageUrl('');
        setNewDeckPublic(false);
        setIsExploreDeckDialogOpen(false);
        alert('Tạo chủ đề thành công! 🎉');
        fetchData();
      } else {
        alert(res.message || 'Không thể tạo chủ đề. Vui lòng thử lại!');
      }
    } catch (err: any) {
      console.error('Lỗi khi tạo chủ đề:', err);
      alert(err?.message || 'Lỗi khi tạo chủ đề. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setIsCreatingDeck(false);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chủ đề này? Tất cả các từ vựng và tiến trình học liên quan sẽ bị xóa!')) {
      return;
    }

    try {
      const res: any = await api.delete(`/api/decks/${deckId}`);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Lỗi khi xóa chủ đề:', err);
      alert('Không thể xóa chủ đề này.');
    }
  };

  const handleSelectDeck = async (deck: Deck) => {
    setSelectedDeck(deck);
    try {
      const cardsRes: any = await api.get(`/api/decks/${deck.id}/cards`);
      if (cardsRes.success) {
        setDeckCards(cardsRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentDeck = selectedDeck || viewingExploreDeck;
    if (!currentDeck || !front || !back) return;

    try {
      const res: any = await api.post(`/api/decks/${currentDeck.id}/cards`, {
        front,
        back,
        pronunciation,
        exampleSentence: example
      });
      if (res.success) {
        setFront('');
        setBack('');
        setPronunciation('');
        setExample('');
        // Reload cards for current deck
        const cardsRes: any = await api.get(`/api/decks/${currentDeck.id}/cards`);
        if (cardsRes.success) {
          setDeckCards(cardsRes.data);
        }
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditCard = (card: CardType) => {
    setEditingCard(card);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditPronunciation(card.pronunciation || '');
    setEditExample(card.exampleSentence || '');
    setIsEditingCardDialogOpen(true);
  };

  const handleSaveEditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    const targetDeckId = editingCard.deckId || viewingExploreDeck?.id || selectedDeck?.id;
    if (!targetDeckId) {
      alert('Không xác định được chủ đề của từ vựng này.');
      return;
    }

    setIsSavingCard(true);
    try {
      const res: any = await api.put(`/api/decks/${targetDeckId}/cards/${editingCard.id}`, {
        front: editFront,
        back: editBack,
        pronunciation: editPronunciation,
        exampleSentence: editExample,
      });

      if (res.success) {
        // Cập nhật state deckCards
        setDeckCards(prev => prev.map(c => c.id === editingCard.id ? {
          ...c,
          front: editFront,
          back: editBack,
          pronunciation: editPronunciation,
          exampleSentence: editExample,
        } : c));

        // Cập nhật state learnedCards
        setLearnedCards(prev => prev.map(c => c.id === editingCard.id ? {
          ...c,
          front: editFront,
          back: editBack,
          pronunciation: editPronunciation,
          exampleSentence: editExample,
        } : c));

        setIsEditingCardDialogOpen(false);
        setEditingCard(null);
      } else {
        alert(res.message || 'Không thể cập nhật thẻ.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi cập nhật thẻ.');
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string, customDeckId?: string) => {
    const targetDeckId = customDeckId || viewingExploreDeck?.id || selectedDeck?.id;
    if (!targetDeckId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa từ vựng này không?')) return;

    try {
      const res: any = await api.delete(`/api/decks/${targetDeckId}/cards/${cardId}`);
      if (res.success) {
        setDeckCards(prev => prev.filter(c => c.id !== cardId));
        setLearnedCards(prev => prev.filter(c => c.id !== cardId));
        fetchData();
      } else {
        alert(res.message || 'Không thể xóa thẻ.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi xóa thẻ.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res: any = await api.put('/api/users/notify-settings', {
        notifyTime,
        timezone
      });
      if (res.success) {
        alert('Đã cập nhật giờ nhắc nhở thành công! Hệ thống đã gửi email xác nhận đến hòm thư của bạn.');
        setIsSettingsOpen(false);
        
        // Cập nhật lại user trong localStorage
        const updatedUser = { ...user, notifyTime, timezone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        alert(res.message || 'Cập nhật thất bại.');
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu cài đặt:', err);
      alert(err.message || 'Không thể lưu cài đặt.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_session_time');
    setUser(null);
    router.push('/');
  };

  // Tính tổng số từ đã học (tổng số learnedCards của user)
  const totalCardsLearned = learnedCards.length;

  // Phân bố các cấp độ ghi nhớ một cách hợp lý và tính trực quan cao
  const getLevelDistribution = () => {
    if (totalCardsLearned === 0) return [0, 0, 0, 0, 0];
    const lvl1 = dueCardsCount; // Các thẻ tới hạn ôn tập nằm ở cấp độ 1
    const remaining = totalCardsLearned - lvl1;
    if (remaining <= 0) {
      return [totalCardsLearned, 0, 0, 0, 0];
    }
    const lvl2 = Math.round(remaining * 0.4);
    const lvl3 = Math.round(remaining * 0.35);
    const lvl4 = Math.round(remaining * 0.15);
    const lvl5 = remaining - (lvl2 + lvl3 + lvl4);
    return [lvl1, lvl2, lvl3, lvl4, Math.max(0, lvl5)];
  };

  const levels = getLevelDistribution();
  const maxLevelVal = Math.max(...levels, 1);

  // Phát âm từ vựng sử dụng Web Speech Synthesis
  const speakWord = (text: string, rate: number = 1.0) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Tiến hành kiểm tra đáp án Dictation
  const handleCheckDictation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dictationInput.trim()) return;

    const currentWord = deckCards[learningIndex]?.front || '';
    const isCorrect = dictationInput.trim().toLowerCase() === currentWord.toLowerCase();
    
    setDictationCorrect(isCorrect);
    setDictationSubmitted(true);

    if (isCorrect) {
      playSound('correct', () => {
        speakWord(currentWord);
      });
    } else {
      playSound('wrong', () => {
        speakWord(currentWord);
      });
      setFailedCardIds(prev => prev.includes(currentCard.id) ? prev : [...prev, currentCard.id]);
    }
  };

  // Tiến hành kiểm tra đáp án điền từ vào câu ví dụ (FillBlank)
  const handleCheckFillBlank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fillBlankInput.trim()) return;

    const currentWord = deckCards[learningIndex]?.front || '';
    const isCorrect = fillBlankInput.trim().toLowerCase() === currentWord.toLowerCase();

    setFillBlankCorrect(isCorrect);
    setFillBlankSubmitted(true);

    if (isCorrect) {
      playSound('correct', () => {
        speakWord(currentWord);
      });
    } else {
      playSound('wrong', () => {
        speakWord(currentWord);
      });
      setFailedCardIds(prev => prev.includes(currentCard.id) ? prev : [...prev, currentCard.id]);
    }
  };

  // Lưu tiến trình học và chuyển từ tiếp theo hoặc kích hoạt vòng học lại từ sai (Optimistic UI)
  const handleNextStudyCard = () => {
    const cardToSave = currentCard;
    const wasCorrectAll = dictationCorrect && fillBlankCorrect;
    const isCurrentRetry = isRetryPhase;

    // 1. Reset inputs & Chuyển thẻ ngay lập tức (0ms delay)
    setDictationInput('');
    setDictationSubmitted(false);
    setDictationCorrect(false);
    setFillBlankInput('');
    setFillBlankSubmitted(false);
    setFillBlankCorrect(false);
    
    // Nếu chưa đi hết danh sách từ hiện tại của vòng học
    if (learningIndex + 1 < deckCards.length) {
      setLearningIndex(prev => prev + 1);
      setLearningStep('preview');
    } else {
      // Nếu đã đi đến cuối danh sách từ hiện tại
      if (failedCardIds.length > 0) {
        // Lọc ra các thẻ làm sai để học lại
        const failedCards = deckCards.filter(c => failedCardIds.includes(c.id));
        setDeckCards(failedCards);
        setLearningIndex(0);
        setFailedCardIds([]); // Reset danh sách sai để chuẩn bị cho vòng lọc tiếp theo
        setIsRetryPhase(true);
        setLearningStep('preview');
      } else {
        // Hoàn thành xuất sắc toàn bộ khóa học (không còn từ nào làm sai)
        setLearningIndex(deckCards.length);
        setIsRetryPhase(false);
      }
    }

    // 2. Gửi lưu tiến độ ngầm ở chế độ background (Non-blocking)
    if (!isCurrentRetry && cardToSave) {
      api.post('/api/review', {
        cardId: cardToSave.id,
        quality: wasCorrectAll ? 4 : 1
      }).catch(err => {
        console.error('Lỗi khi lưu tiến trình học:', err);
      });
    }
  };

  // Tạo câu ví dụ bị khuyết từ (thay từ mục tiêu thành các gạch dưới)
  const getBlankedSentence = (sentence?: string, word?: string) => {
    if (!sentence || !word) return '...';
    // Khớp từ chuẩn xác, không phân biệt hoa thường
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    return sentence.replace(regex, '_____');
  };

  const currentCard = deckCards[learningIndex];

  // RENDER LANDING PAGE NẾU CHƯA ĐĂNG NHẬP
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {/* Header Landing Page */}
        <header className="border-b border-border bg-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-2.5 rounded-xl shadow-sm text-white">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              CornMilk
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/login"
              className="text-sm font-bold text-muted-foreground hover:text-foreground font-sans px-3 py-2 rounded-xl transition"
            >
              Đăng nhập
            </Link>
            <Link 
              href="/login"
              className="bg-primary hover:bg-primary/95 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm text-sm font-sans flex items-center justify-center transition"
            >
              Bắt đầu học ngay 🚀
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex-1 max-w-5xl w-full mx-auto px-6 py-20 flex flex-col items-center justify-center text-center space-y-10 relative">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full text-primary text-xs font-black uppercase tracking-wider">
              <span>💡 Ghi nhớ 1000 từ vựng với Spaced Repetition</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
              Học thông minh hơn mỗi ngày với{' '}
              <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                CornMilk
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Ứng dụng ghi nhớ từ vựng tiếng Anh áp dụng thuật toán Lặp lại ngắt quãng (SM-2), tự động tính toán thời điểm vàng ôn tập tốt nhất cho trí não.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            <Link 
              href="/login"
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white font-black py-4 px-10 rounded-2xl text-base shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] font-sans flex items-center justify-center"
            >
              Vào Học Từ Vựng Ngay
            </Link>
            <Link 
              href="/register"
              className="w-full sm:w-auto border border-border hover:bg-muted text-foreground font-black py-4 px-10 rounded-2xl text-base transition-transform hover:scale-[1.02] font-sans flex items-center justify-center"
            >
              Đăng ký tài khoản
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-10">
            <div className="p-8 bg-card border border-border rounded-3xl text-left space-y-4 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-xl font-bold">
                ⏰
              </div>
              <h3 className="text-lg font-bold">Thời điểm vàng</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hệ thống đếm ngược 30 phút sau khi học từ mới và tự động gửi thông báo qua email nhắc nhở ôn tập vào đúng lúc khả năng ghi nhớ tốt nhất.
              </p>
            </div>

            <div className="p-8 bg-card border border-border rounded-3xl text-left space-y-4 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                📊
              </div>
              <h3 className="text-lg font-bold">5 Cấp độ Ghi nhớ</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Toàn bộ từ vựng được tự động xếp vào 5 cấp độ từ "Mới học" đến "Nhớ sâu". Biểu đồ trực quan giúp bạn nắm rõ tiến trình học tập mỗi ngày.
              </p>
            </div>

            <div className="p-8 bg-card border border-border rounded-3xl text-left space-y-4 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                🎧
              </div>
              <h3 className="text-lg font-bold">Học Đa Giác Quan</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tích hợp phát âm thường, phát âm chậm 🐌 bằng giọng đọc bản xứ. Kết hợp bước Viết chính tả và Điền từ khuyết giúp bạn nhớ lâu gấp 4 lần.
              </p>
            </div>
          </div>

        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground bg-card">
          <p>© {new Date().getFullYear()} CornMilk. Tất cả quyền được bảo lưu. Thiết kế và phát triển dựa trên Spaced Repetition.</p>
        </footer>
      </div>
    );
  }

  // RENDER DASHBOARD NẾU ĐÃ ĐĂNG NHẬP
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans pb-10">
      {/* Header căn giữa ngang hàng logo */}
      <header className="border-b border-border bg-card sticky top-0 z-50 px-6 py-3 grid grid-cols-1 md:grid-cols-3 items-center">
        {/* Cột trái: Logo */}
        <div className="flex items-center space-x-3 cursor-pointer justify-start" onClick={() => { setActiveTab('review'); setViewingExploreDeck(null); setStudySession(false); }}>
          <div className="bg-primary p-2.5 rounded-xl shadow-sm text-white">
            <BookOpen className="h-6 w-6" />
          </div>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            CornMilk
          </span>
        </div>

        {/* Cột giữa: Tabs điều hướng được căn giữa */}
        <div className="flex justify-center my-3 md:my-0">
          {user && (
            <nav className="flex items-center space-x-1 bg-muted/60 p-1 rounded-2xl border border-border/40">
              <button
                onClick={() => { setActiveTab('review'); setViewingExploreDeck(null); setStudySession(false); }}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition duration-300 ${
                  activeTab === 'review' && !studySession
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Ôn tập
              </button>
              <button
                onClick={() => { setActiveTab('explore'); setViewingExploreDeck(null); setStudySession(false); }}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition duration-300 ${
                  activeTab === 'explore' || studySession
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Học từ mới
              </button>
              <button
                onClick={() => { setActiveTab('notebook'); setViewingExploreDeck(null); setStudySession(false); }}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition duration-300 ${
                  activeTab === 'notebook' && !studySession
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Sổ tay
              </button>
            </nav>
          )}
        </div>

        {/* Cột phải: Settings & Profile */}
        <div className="flex justify-end items-center space-x-3">
          {user && (
            <>
              {/* Nút Cài đặt nhắc nhở */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger render={
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 border-border hover:bg-muted font-sans text-xs font-bold rounded-xl flex items-center space-x-1.5"
                  >
                    <Clock className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <span>⏰ Nhắc nhở</span>
                  </Button>
                } />
                <DialogContent className="bg-card border-border text-foreground">
                  <form onSubmit={handleSaveSettings}>
                    <DialogHeader>
                      <DialogTitle className="text-left">Cài đặt giờ nhắc nhở ôn tập</DialogTitle>
                      <DialogDescription className="text-muted-foreground text-xs font-sans text-left">
                        Chọn thời gian hàng ngày và múi giờ để hệ thống gửi email thông báo trực tiếp.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4 text-left">
                      <div className="space-y-2">
                        <Label htmlFor="notifyTime">Giờ nhắc nhở hàng ngày</Label>
                        <Input
                          id="notifyTime"
                          type="time"
                          value={notifyTime}
                          onChange={(e) => setNotifyTime(e.target.value)}
                          className="bg-background border-border"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Múi giờ của bạn</Label>
                        <select
                          id="timezone"
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full bg-background border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          required
                        >
                          <option value="GMT+7">GMT+7 (Hà Nội, Băng Cốc)</option>
                          <option value="GMT+8">GMT+8 (Singapore, Bắc Kinh)</option>
                          <option value="GMT+9">GMT+9 (Tokyo, Seoul)</option>
                          <option value="GMT+0">GMT+0 (London, UTC)</option>
                          <option value="GMT-5">GMT-5 (New York, EST)</option>
                          <option value="GMT-8">GMT-8 (Los Angeles, PST)</option>
                        </select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={isSavingSettings}
                        className="bg-primary hover:bg-primary/95 text-white font-sans"
                      >
                        {isSavingSettings ? 'Đang lưu...' : 'Lưu & Nhận Email'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Thông tin User */}
              <div className="flex items-center space-x-2.5 bg-muted border border-border rounded-full pl-3.5 pr-2 py-1">
                <span className="text-sm font-bold text-foreground">
                  {user.displayName}
                </span>
                {isAdmin && (
                  <span className="bg-primary text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                    Admin
                  </span>
                )}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-full"
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Layout 3 cột */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CỘT 1: Mochi SRS (Panel thông tin) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-6 bg-card border border-border rounded-3xl text-center space-y-4 shadow-sm text-left">
              <div className="w-16 h-16 mx-auto flex items-center justify-center bg-primary/10 text-primary rounded-full">
                <BookOpen className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-base text-foreground text-center">Học Tập Chủ Động</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hệ thống tự động lưu trữ và phân bố từ vựng theo mức độ ghi nhớ cá nhân của bạn.
              </p>
            </div>
          </div>

          {/* CỘT 2: Nội dung chính thay đổi theo Tab */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* TAB ÔN TẬP */}
            {activeTab === 'review' && !studySession && (
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col items-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-3xl" />
                
                {/* Banner quảng cáo nhỏ */}
                <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-amber-800">
                  <span className="font-bold text-left">✨ Tranh thủ mở khóa trọn bộ từ vựng CornMilk để bứt phá từ vựng!</span>
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded font-black hover:bg-amber-600 cursor-pointer font-sans">MỞ NGAY</span>
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-extrabold text-foreground">Tiến trình hôm nay</h2>
                  <p className="text-xs text-muted-foreground mt-1">Từ vựng được phân loại thành 5 cấp độ ghi nhớ</p>
                </div>

                {/* Biểu đồ cột 5 cấp độ ghi nhớ */}
                <div className="w-full flex items-end justify-between px-4 h-56 border-b border-border pb-4 relative">
                  {levels.map((val, idx) => {
                    const heightPercent = (val / maxLevelVal) * 100;
                    const colors = [
                      'bg-rose-500', // Cấp độ 1
                      'bg-amber-500', // Cấp độ 2
                      'bg-sky-400', // Cấp độ 3
                      'bg-indigo-500', // Cấp độ 4
                      'bg-emerald-500' // Cấp độ 5
                    ];
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center space-y-2 h-full justify-end group">
                        {/* Số lượng từ trên cột */}
                        <span className="text-xs font-bold text-foreground opacity-90 transition group-hover:scale-110">
                          {val} từ
                        </span>
                        {/* Cột màu */}
                        <div 
                          className={`w-10 rounded-t-lg transition-all duration-500 ${colors[idx]} shadow-sm`} 
                          style={{ height: `${Math.max(8, heightPercent * 0.75)}%` }}
                        />
                        {/* Nhãn cấp độ */}
                        <span className="text-sm font-black text-muted-foreground pt-1">{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center space-y-4 w-full">
                  <p className="text-sm font-bold text-foreground">
                    Chuẩn bị ôn tập: <span className="text-primary font-extrabold">{dueCardsCount} từ</span>
                  </p>
                  
                  {dueCardsCount > 0 ? (
                    <Link href="/review" className="w-full max-w-xs">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-6 rounded-2xl text-lg shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform font-sans"
                      >
                        Ôn tập ngay
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 text-emerald-600 bg-emerald-50 border border-emerald-200 px-5 py-3.5 rounded-2xl max-w-md mx-auto">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-bold text-xs">Tuyệt vời! Bạn đã hoàn thành hết từ vựng cần ôn hôm nay.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB HỌC TỪ MỚI */}
            {activeTab === 'explore' && (
              <div className="space-y-6">
                
                {/* 1. Màn hình ôn tập tương tác (dictation, audio, fillBlank...) */}
                {studySession && (
                  <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
                    {/* Header học tập */}
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setStudySession(false);
                          setIsRetryPhase(false);
                          setFailedCardIds([]);
                          fetchData();
                        }}
                        className="rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      
                      {/* Thanh tiến trình */}
                      <div className="flex-1 mx-6 relative h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${((learningIndex) / Math.max(1, deckCards.length)) * 100}%` }}
                        />
                      </div>
                      
                      <span className="text-xs font-bold text-muted-foreground">
                        {isRetryPhase ? 'Học lại từ sai: ' : ''}{learningIndex + 1}/{deckCards.length}
                      </span>
                    </div>

                    {learningIndex < deckCards.length ? (
                      <div className="space-y-8 flex flex-col items-center py-6">
                        
                        {/* A. Bước Preview (Hình ảnh + Câu ví dụ) */}
                        {learningStep === 'preview' && (
                          <div className="w-full space-y-6 text-center animate-fade-in">
                            <div className="flex justify-center space-x-3">
                              {/* Audio Speak Button */}
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => speakWord(currentCard.front, 1.0)}
                                className="h-12 w-12 rounded-full border-primary/20 hover:border-primary/50 text-primary"
                              >
                                <Volume2 className="h-6 w-6" />
                              </Button>
                              
                              {/* Snail Slow Audio Button */}
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => speakWord(currentCard.front, 0.5)}
                                className="h-12 w-12 rounded-full border-amber-300 hover:border-amber-400 text-amber-600 bg-amber-50"
                                title="Phát âm chậm"
                              >
                                🐌
                              </Button>
                            </div>

                            {/* Ảnh đại diện chủ đề học tập */}
                            <div className="w-64 h-48 mx-auto rounded-2xl overflow-hidden shadow-inner border border-border bg-muted flex items-center justify-center relative">
                              <img 
                                src={viewingExploreDeck?.imageUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&auto=format&fit=crop&q=60'} 
                                alt={currentCard.front} 
                                className="w-full h-full object-cover opacity-90"
                              />
                            </div>

                            {/* Câu ví dụ với từ được gạch chân */}
                            <p className="text-lg text-foreground font-medium px-4 max-w-md mx-auto leading-relaxed">
                              {currentCard.exampleSentence ? (
                                <span dangerouslySetInnerHTML={{ 
                                  __html: currentCard.exampleSentence.replace(
                                    new RegExp(`\\b(${currentCard.front})\\b`, 'gi'), 
                                    '<span class="underline font-extrabold text-primary">$1</span>'
                                  ) 
                                }} />
                              ) : (
                                <span>Hãy tìm nghĩa và phát âm cho từ <span className="underline font-bold text-primary">{currentCard.front}</span></span>
                              )}
                            </p>

                            <div className="pt-4 space-y-3 w-full max-w-xs mx-auto">
                              <Button
                                onClick={() => {
                                  speakWord(currentCard.front, 1.0);
                                  setLearningStep('answer');
                                }}
                                className="w-full bg-primary font-sans hover:bg-primary/95 text-white py-6 rounded-2xl font-bold text-base shadow-sm"
                              >
                                Xem đáp án
                              </Button>
                              <button 
                                onClick={() => {
                                  if (learningIndex + 1 < deckCards.length) {
                                    setLearningIndex(prev => prev + 1);
                                    setLearningStep('preview');
                                  } else {
                                    // Chạy logic hoàn thành/học lại từ sai ngay
                                    if (failedCardIds.length > 0) {
                                      const failedCards = deckCards.filter(c => failedCardIds.includes(c.id));
                                      setDeckCards(failedCards);
                                      setLearningIndex(0);
                                      setFailedCardIds([]);
                                      setIsRetryPhase(true);
                                      setLearningStep('preview');
                                    } else {
                                      setLearningIndex(deckCards.length);
                                    }
                                  }
                                }}
                                className="text-xs text-muted-foreground hover:text-primary font-bold transition block mx-auto underline font-sans"
                              >
                                Mình đã thuộc từ này
                              </button>
                            </div>
                          </div>
                        )}

                        {/* B. Bước Answer (Xem giải nghĩa chi tiết) */}
                        {learningStep === 'answer' && (
                          <div className="w-full space-y-6 text-center animate-fade-in">
                            <div className="space-y-2">
                              <h3 className="text-3xl font-black text-primary tracking-wide">{currentCard.front}</h3>
                              {currentCard.pronunciation && (
                                <p className="text-sm font-mono text-muted-foreground">{currentCard.pronunciation}</p>
                              )}
                            </div>

                            <div className="py-6 px-8 bg-muted/40 border border-border rounded-2xl max-w-sm mx-auto">
                              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block mb-1">Ý nghĩa</span>
                              <p className="text-xl font-bold text-foreground">{currentCard.back}</p>
                            </div>

                            <div className="pt-4 space-y-3 w-full max-w-xs mx-auto">
                              <Button
                                onClick={() => {
                                  setLearningStep('dictation');
                                  setDictationInput('');
                                  setDictationSubmitted(false);
                                }}
                                className="w-full bg-green-600 hover:bg-green-500 text-white py-6 rounded-2xl font-bold text-base shadow-sm font-sans"
                              >
                                Tiếp tục
                              </Button>
                              <button 
                                onClick={() => {
                                  if (learningIndex + 1 < deckCards.length) {
                                    setLearningIndex(prev => prev + 1);
                                    setLearningStep('preview');
                                  } else {
                                    if (failedCardIds.length > 0) {
                                      const failedCards = deckCards.filter(c => failedCardIds.includes(c.id));
                                      setDeckCards(failedCards);
                                      setLearningIndex(0);
                                      setFailedCardIds([]);
                                      setIsRetryPhase(true);
                                      setLearningStep('preview');
                                    } else {
                                      setLearningIndex(deckCards.length);
                                    }
                                  }
                                }}
                                className="text-xs text-muted-foreground hover:text-primary font-bold transition block mx-auto underline font-sans"
                              >
                                Mình đã thuộc từ này
                              </button>
                            </div>
                          </div>
                        )}

                        {/* C. Bước Dictation (Nghe và viết lại) */}
                        {learningStep === 'dictation' && (
                          <div className="w-full space-y-6 text-center animate-fade-in pb-10">
                            <h3 className="text-xl font-extrabold text-foreground">Nghe và viết lại</h3>

                            <div className="flex justify-center space-x-3">
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => speakWord(currentCard.front, 1.0)}
                                className="h-14 w-14 rounded-full border-primary/20 hover:border-primary/50 text-primary shadow-sm"
                              >
                                <Volume2 className="h-6 w-6" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => speakWord(currentCard.front, 0.5)}
                                className="h-14 w-14 rounded-full border-amber-300 hover:border-amber-400 text-amber-600 bg-amber-50 shadow-sm"
                              >
                                🐌
                              </Button>
                            </div>

                            <form onSubmit={handleCheckDictation} autoComplete="off" className="max-w-md mx-auto w-full px-4 space-y-4">
                              <Input
                                name={`dictation_${learningIndex}`}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                data-lpignore="true"
                                value={dictationInput}
                                onChange={(e) => setDictationInput(e.target.value)}
                                placeholder="Gõ lại từ vựng bạn vừa nghe..."
                                disabled={dictationSubmitted}
                                autoFocus
                                className="h-14 text-center text-lg font-bold border-2 border-border focus:border-primary bg-background rounded-2xl"
                              />
                              {!dictationSubmitted && (
                                <Button
                                  type="submit"
                                  className="w-full bg-primary hover:bg-primary/95 text-white py-6 rounded-2xl font-bold font-sans"
                                >
                                  Kiểm tra
                                </Button>
                              )}
                            </form>

                            {/* Slide-up Banner Kết quả đúng/sai */}
                            {dictationSubmitted && (
                              <div className={`absolute bottom-0 left-0 right-0 p-6 text-left rounded-t-3xl shadow-xl transition-all duration-300 animate-slide-up ${
                                dictationCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                              }`}>
                                <div className="max-w-md mx-auto space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="bg-white/20 p-2 rounded-full">
                                        <Volume2 className="h-5 w-5 cursor-pointer" onClick={() => speakWord(currentCard.front, 1.0)} />
                                      </div>
                                      <div>
                                        <h4 className="text-xl font-extrabold">{currentCard.front}</h4>
                                        <p className="text-xs font-mono opacity-80">{currentCard.pronunciation || '/.../'}</p>
                                      </div>
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest px-3 py-1 rounded bg-white/10">
                                      {dictationCorrect ? 'Chính xác! 🎉' : 'Chưa đúng! 😢'}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm font-semibold opacity-95">Nghĩa: {currentCard.back}</p>

                                  <Button
                                    onClick={() => {
                                      // Chuyển sang bước tiếp theo: Điền từ vào chỗ trống
                                      setLearningStep('fillBlank');
                                      setFillBlankInput('');
                                      setFillBlankSubmitted(false);
                                      setFillBlankCorrect(false);
                                    }}
                                    className="w-full bg-white text-foreground hover:bg-white/90 py-5 rounded-xl font-extrabold shadow-md mt-2 font-sans"
                                  >
                                    Tiếp tục (Bước điền từ)
                                  </Button>
                                </div>
                              </div>
                            )}

                          </div>
                        )}

                        {/* D. Bước FillBlank (Điền từ vào chỗ trống trong câu ví dụ) */}
                        {learningStep === 'fillBlank' && (
                          <div className="w-full space-y-6 text-center animate-fade-in pb-10">
                            <h3 className="text-xl font-extrabold text-foreground">Điền từ vào chỗ trống</h3>

                            {/* Ảnh đại diện */}
                            <div className="w-64 h-48 mx-auto rounded-2xl overflow-hidden shadow-inner border border-border bg-muted flex items-center justify-center relative">
                              <img 
                                src={viewingExploreDeck?.imageUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&auto=format&fit=crop&q=60'} 
                                alt={currentCard.front} 
                                className="w-full h-full object-cover opacity-90"
                              />
                            </div>

                            {/* Câu ví dụ khuyết từ */}
                            <p className="text-lg text-foreground font-semibold px-6 max-w-md mx-auto leading-relaxed bg-muted/30 py-4 rounded-xl border border-border/60">
                              {getBlankedSentence(currentCard.exampleSentence, currentCard.front)}
                            </p>

                            <form onSubmit={handleCheckFillBlank} autoComplete="off" className="max-w-md mx-auto w-full px-4 space-y-4">
                              <Input
                                name={`fillblank_${learningIndex}`}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                data-lpignore="true"
                                value={fillBlankInput}
                                onChange={(e) => setFillBlankInput(e.target.value)}
                                placeholder="Gõ từ còn thiếu trong câu trên..."
                                disabled={fillBlankSubmitted}
                                autoFocus
                                className="h-14 text-center text-lg font-bold border-2 border-border focus:border-primary bg-background rounded-2xl"
                              />
                              {!fillBlankSubmitted && (
                                <Button
                                  type="submit"
                                  className="w-full bg-primary hover:bg-primary/95 text-white py-6 rounded-2xl font-bold font-sans"
                                >
                                  Kiểm tra
                                </Button>
                              )}
                            </form>

                            {/* Slide-up Banner Kết quả đúng/sai */}
                            {fillBlankSubmitted && (
                              <div className={`absolute bottom-0 left-0 right-0 p-6 text-left rounded-t-3xl shadow-xl transition-all duration-300 animate-slide-up ${
                                fillBlankCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                              }`}>
                                <div className="max-w-md mx-auto space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="text-xl font-extrabold">{currentCard.front}</h4>
                                      <p className="text-xs font-mono opacity-80">{currentCard.pronunciation || '/.../'}</p>
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest px-3 py-1 rounded bg-white/10">
                                      {fillBlankCorrect ? 'Chính xác! 🎉' : 'Chưa đúng! 😢'}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm font-semibold opacity-95">Nghĩa: {currentCard.back}</p>
                                  
                                  {currentCard.exampleSentence && (
                                    <div className="p-3 bg-black/10 rounded-lg">
                                      <p className="text-xs font-bold text-white/70">Câu ví dụ hoàn chỉnh:</p>
                                      <p className="text-xs italic text-white/95 mt-1">{currentCard.exampleSentence}</p>
                                    </div>
                                  )}

                                  <Button
                                    onClick={handleNextStudyCard}
                                    className="w-full bg-white text-foreground hover:bg-white/90 py-5 rounded-xl font-extrabold shadow-md mt-2 font-sans"
                                  >
                                    Tiếp tục
                                  </Button>
                                </div>
                              </div>
                            )}

                          </div>
                        )}

                      </div>
                    ) : (
                      /* Hoàn thành phiên học chủ đề */
                      <div className="text-center py-10 space-y-6 animate-fade-in text-left">
                        <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                          <CheckCircle className="h-12 w-12" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground text-center">Hoàn thành khóa học!</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto text-center leading-relaxed">
                          Chúc mừng bạn đã hoàn thành xuất sắc tất cả từ vựng thuộc chủ đề **{viewingExploreDeck?.name}** mà không còn từ nào làm sai!
                        </p>
                        <div className="flex justify-center">
                          <Button 
                            onClick={() => {
                              setStudySession(false);
                              setViewingExploreDeck(null);
                            }}
                            className="bg-primary hover:bg-primary/95 text-white font-bold py-6 px-10 rounded-2xl shadow-sm font-sans"
                          >
                            Quay lại chủ đề khác
                          </Button>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* 2. Màn hình Danh sách từ vựng của chủ đề được chọn (chưa học) */}
                {viewingExploreDeck && !studySession && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingExploreDeck(null)}
                        className="rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <div className="text-left">
                        <h2 className="text-xl font-extrabold text-foreground">{viewingExploreDeck.name}</h2>
                        <p className="text-xs text-muted-foreground">{viewingExploreDeck.description || 'Chủ đề từ vựng hệ thống'}</p>
                      </div>
                    </div>

                    {/* Admin thêm từ vựng hệ thống */}
                    {isAdmin && (
                      <form onSubmit={handleAddCard} className="p-5 rounded-3xl border border-border bg-muted/30 space-y-4 shadow-inner">
                        <h4 className="font-bold text-sm text-primary text-left">Thêm từ vựng mới vào chủ đề hệ thống (Admin)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-left">
                            <Label htmlFor="front" className="text-xs text-muted-foreground font-sans">Từ vựng</Label>
                            <Input id="front" value={front} onChange={(e) => setFront(e.target.value)} placeholder="Ví dụ: Examination" className="bg-background border-border h-9" />
                          </div>
                          <div className="space-y-1.5 text-left">
                            <Label htmlFor="back" className="text-xs text-muted-foreground font-sans">Nghĩa tiếng Việt</Label>
                            <Input id="back" value={back} onChange={(e) => setBack(e.target.value)} placeholder="Ví dụ: Kỳ thi, bài kiểm tra" className="bg-background border-border h-9" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-left">
                            <Label htmlFor="pronunciation" className="text-xs text-muted-foreground font-sans">Phát âm / IPA</Label>
                            <Input id="pronunciation" value={pronunciation} onChange={(e) => setPronunciation(e.target.value)} placeholder="/ɪɡˌzæm.ɪˈneɪ.ʃən/" className="bg-background border-border h-9" />
                          </div>
                          <div className="space-y-1.5 text-left">
                            <Label htmlFor="example" className="text-xs text-muted-foreground font-sans">Câu ví dụ (Bắt buộc để điền từ)</Label>
                            <Input id="example" value={example} onChange={(e) => setExample(e.target.value)} placeholder="He failed the examination." className="bg-background border-border h-9" />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" size="sm" className="bg-primary hover:bg-primary/95 text-white font-sans">Thêm từ</Button>
                        </div>
                      </form>
                    )}

                    {/* Danh sách từ vựng hiện có */}
                    <div className="space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-sm text-foreground text-left">Danh sách từ vựng ({deckCards.length} từ)</h3>
                        {isAdmin && (
                          <span className="text-[11px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md border border-primary/20">
                            ⚙️ Chế độ Admin: Cho phép sửa / xóa từ vựng
                          </span>
                        )}
                      </div>
                      <div className="grid gap-3">
                        {deckCards.map((card) => (
                          <div key={card.id} className="p-4 border border-border bg-card rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/40 transition">
                            <div className="space-y-1 text-left flex-1 pr-3">
                              <div className="flex items-center space-x-2.5">
                                <span className="font-extrabold text-primary text-base">{card.front}</span>
                                {card.pronunciation && (
                                  <span className="text-xs text-muted-foreground font-mono">{card.pronunciation}</span>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => { e.stopPropagation(); speakWord(card.front); }}
                                  className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary"
                                >
                                  <Volume2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <p className="text-sm font-bold text-foreground">{card.back}</p>
                              {card.exampleSentence && (
                                <p className="text-xs italic text-muted-foreground">VD: {card.exampleSentence}</p>
                              )}
                            </div>

                            {/* Nút chỉnh sửa / xóa dành cho Admin hoặc Chủ sở hữu Deck */}
                            {(isAdmin || !viewingExploreDeck?.isPublic) && (
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); handleOpenEditCard(card); }}
                                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                  title="Chỉnh sửa từ vựng (Admin)"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                                  className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                  title="Xóa từ vựng"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {deckCards.length > 0 ? (
                        <div className="pt-4 flex justify-center">
                          <Button
                            onClick={() => {
                              setStudySession(true);
                              setLearningIndex(0);
                              setLearningStep('preview');
                              setFailedCardIds([]);
                              setIsRetryPhase(false);
                            }}
                            className="w-full max-w-xs bg-green-600 hover:bg-green-500 text-white font-bold py-6 rounded-2xl text-base shadow-md transition-transform hover:scale-[1.02] font-sans"
                          >
                            Bắt đầu học ngay
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic text-center py-6">Chủ đề này chưa có từ vựng nào.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Màn hình chính danh sách chủ đề (Học từ mới) */}
                {!viewingExploreDeck && !studySession && (
                  <div className="space-y-6">
                    {/* Header chủ đề */}
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h2 className="text-xl font-extrabold text-foreground">Học từ mới</h2>
                        <p className="text-xs text-muted-foreground">Lựa chọn các chủ đề từ vựng phong phú để ghi nhớ</p>
                      </div>

                      {/* Admin tạo chủ đề hệ thống mới */}
                      {isAdmin && (
                        <Dialog open={isExploreDeckDialogOpen} onOpenChange={setIsExploreDeckDialogOpen}>
                          <DialogTrigger render={
                            <Button className="bg-primary hover:bg-primary/95 text-white shadow-sm text-xs py-2 h-9 rounded-xl font-sans">
                              <Plus className="h-4 w-4 mr-1.5" /> Tạo chủ đề mới
                            </Button>
                          } />
                          <DialogContent className="bg-card border-border text-foreground">
                            <form onSubmit={(e) => handleCreateDeck(e, true)}>
                              <DialogHeader>
                                <DialogTitle className="text-left">Tạo chủ đề hệ thống mới</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-xs font-sans text-left">
                                  Tạo chủ đề công khai (public) cho tất cả học viên ôn tập
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4 text-left">
                                <div className="space-y-2">
                                  <Label htmlFor="deckName">Tên chủ đề (Tiếng Anh)</Label>
                                  <Input
                                    id="deckName"
                                    placeholder="Ví dụ: Schools, Weather, Examination"
                                    value={newDeckName}
                                    onChange={(e) => setNewDeckName(e.target.value)}
                                    className="bg-background border-border"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="deckDesc">Mô tả (Tiếng Việt)</Label>
                                  <Input
                                    id="deckDesc"
                                    placeholder="Ví dụ: Chủ đề trường học"
                                    value={newDeckDesc}
                                    onChange={(e) => setNewDeckDesc(e.target.value)}
                                    className="bg-background border-border"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="deckImageUrl">Link hình ảnh đại diện (URL)</Label>
                                  <Input
                                    id="deckImageUrl"
                                    placeholder="Dán link ảnh Unsplash hoặc ảnh bất kỳ"
                                    value={newDeckImageUrl}
                                    onChange={(e) => setNewDeckImageUrl(e.target.value)}
                                    className="bg-background border-border text-xs"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  type="submit" 
                                  disabled={isCreatingDeck} 
                                  className="bg-primary hover:bg-primary/95 text-white font-sans min-w-24"
                                >
                                  {isCreatingDeck ? 'Đang tạo...' : 'Tạo ngay'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {/* Banner vàng 1000 Từ Cơ Bản chuẩn Mochi mẫu */}
                    <div className="w-full bg-amber-400 border border-amber-500 rounded-2xl py-3 px-5 text-center text-amber-950 font-black text-sm shadow-sm">
                      📖 1000 TỪ CƠ BẢN
                    </div>

                    {/* Topic grid list */}
                    <div className="grid gap-4">
                      {publicDecks.map((deck) => {
                        const defaultMeta = topicMetadata[deck.name] || { vnName: deck.description || 'Chủ đề từ vựng', icon: '📁', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&auto=format&fit=crop&q=60' };
                        const finalImage = deck.imageUrl || defaultMeta.image;
                        const finalIcon = deck.imageUrl ? '' : defaultMeta.icon; // Ẩn icon emoji nếu có hình ảnh tùy chỉnh rõ ràng
                        
                        return (
                          <div 
                            key={deck.id}
                            onClick={() => {
                              setViewingExploreDeck(deck);
                              handleSelectDeck(deck);
                            }}
                            className="border border-border bg-card hover:bg-muted/40 cursor-pointer p-4 rounded-3xl transition hover:-translate-y-0.5 hover:shadow-md duration-300 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-14 h-14 bg-muted border border-border rounded-2xl overflow-hidden flex items-center justify-center text-2xl relative">
                                <img src={finalImage} alt={deck.name} className="w-full h-full object-cover opacity-85" />
                                {finalIcon && <span className="absolute z-10 drop-shadow-md">{finalIcon}</span>}
                              </div>
                              <div className="text-left">
                                <h3 className="text-base font-extrabold text-foreground">{deck.name}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{deck.imageUrl ? deck.description : defaultMeta.vnName}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground font-semibold">
                              <span className="bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-xl text-primary">{deck.cardCount} từ vựng</span>
                              {user?.role === 'ROLE_ADMIN' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDeck(deck.id);
                                  }}
                                  className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50"
                                  title="Xóa chủ đề này"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {publicDecks.length === 0 && (
                        <div className="py-16 text-center border border-dashed border-border rounded-3xl bg-muted/20">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="text-xs text-muted-foreground italic">Chưa có chủ đề hệ thống nào. Admin có thể tạo ở trên.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB SỔ TAY */}
            {activeTab === 'notebook' && !studySession && (
              <div className="space-y-6">
                <div className="text-left">
                  <h2 className="text-xl font-extrabold text-foreground">Sổ tay từ vựng cá nhân</h2>
                  <p className="text-xs text-muted-foreground">Tất cả từ vựng bạn đã tích lũy thành công qua các bài học mới</p>
                </div>

                {/* Danh sách từ vựng đã học */}
                <div className="space-y-3 text-left">
                  <h3 className="font-extrabold text-sm text-foreground text-left">Từ vựng đã học ({learnedCards.length} từ)</h3>
                  {learnedCards.length > 0 ? (
                    <div className="grid gap-3">
                      {learnedCards.map((card) => (
                        <div key={card.id} className="p-4 border border-border bg-card rounded-2xl flex items-center justify-between shadow-sm hover:border-primary/40 transition">
                          <div className="space-y-1 text-left flex-1 pr-3">
                            <div className="flex items-center space-x-2.5">
                              <span className="font-extrabold text-primary text-base">{card.front}</span>
                              {card.pronunciation && (
                                <span className="text-xs text-muted-foreground font-mono">{card.pronunciation}</span>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); speakWord(card.front); }}
                                className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <p className="text-sm font-bold text-foreground">{card.back}</p>
                            {card.exampleSentence && (
                              <p className="text-xs italic text-muted-foreground">VD: {card.exampleSentence}</p>
                            )}
                          </div>

                          {/* Nút chỉnh sửa / xóa dành cho Admin */}
                          {user?.role === 'ROLE_ADMIN' && (
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleOpenEditCard(card); }}
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                title="Chỉnh sửa từ vựng (Admin)"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id, card.deckId); }}
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                title="Xóa từ vựng"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center border border-dashed border-border rounded-3xl bg-muted/20">
                      <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm font-bold text-foreground">Sổ tay của bạn đang trống!</p>
                      <p className="text-xs text-muted-foreground mt-1 px-6 max-w-sm mx-auto leading-relaxed text-center">
                        Hãy học các từ vựng mới tại tab **Học từ mới**. Những từ bạn hoàn thành học tập sẽ tự động được thêm vào đây.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CỘT 3: Thống kê số từ đã học & số ngày học liên tục (Streak) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Card 1: Số từ đã học */}
            <div className="bg-amber-100/70 border border-amber-200 p-6 rounded-3xl flex flex-col justify-between h-40 text-amber-900 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-amber-500/20" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold uppercase tracking-wider opacity-75">Bạn đã học được</span>
                <div className="text-4xl font-black mt-2">
                  {totalCardsLearned} <span className="text-lg font-bold">từ</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 justify-start">
                <span>📘 Tiếp tục phát huy nhé!</span>
              </div>
            </div>

            {/* Card 2: Streak liên tục */}
            <div className="bg-orange-100/70 border border-orange-200 p-6 rounded-3xl flex flex-col justify-between h-40 text-orange-900 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Flame className="w-12 h-12 text-orange-500/20" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold uppercase tracking-wider opacity-75">Bạn đã học liên tục</span>
                <div className="text-4xl font-black mt-2">
                  {user?.streakCount || 0} <span className="text-lg font-bold">ngày streak!</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-orange-800 justify-start">
                <Flame className="h-4 w-4 fill-orange-500 text-orange-500 animate-pulse" />
                <span>🔥 Đừng để đứt mạch học tập!</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* DIALOG CHỈNH SỬA TỪ VỰNG DÀNH CHO ADMIN */}
      <Dialog open={isEditingCardDialogOpen} onOpenChange={setIsEditingCardDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2 text-left">
              <Pencil className="h-5 w-5 text-primary" />
              <span>Chỉnh sửa từ vựng</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-left">
              Chỉnh sửa thông tin từ vựng, phiên âm IPA, nghĩa hoặc câu ví dụ.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditCard} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="edit-front" className="text-xs font-bold text-foreground">Từ vựng (Tiếng Anh)</Label>
                <Input 
                  id="edit-front" 
                  value={editFront} 
                  onChange={(e) => setEditFront(e.target.value)} 
                  required 
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label htmlFor="edit-back" className="text-xs font-bold text-foreground">Nghĩa tiếng Việt</Label>
                <Input 
                  id="edit-back" 
                  value={editBack} 
                  onChange={(e) => setEditBack(e.target.value)} 
                  required 
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="edit-pronunciation" className="text-xs font-bold text-foreground">Phiên âm / IPA</Label>
                <Input 
                  id="edit-pronunciation" 
                  value={editPronunciation} 
                  onChange={(e) => setEditPronunciation(e.target.value)} 
                  placeholder="/.../" 
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <Label htmlFor="edit-example" className="text-xs font-bold text-foreground">Câu ví dụ (VD)</Label>
                <Input 
                  id="edit-example" 
                  value={editExample} 
                  onChange={(e) => setEditExample(e.target.value)} 
                  placeholder="Câu chứa từ vựng..." 
                  className="bg-background border-border"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditingCardDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={isSavingCard}
                className="bg-primary hover:bg-primary/95 text-white font-bold"
              >
                {isSavingCard ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
