'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { playSound } from '@/lib/sound';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Volume2, Check, X, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

interface CardProgressType {
  cardId: string;
  front: string;
  back: string;
  exampleSentence?: string;
  pronunciation?: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CardProgressType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // States for writing/typing check
  const [typedWord, setTypedWord] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Load due cards
  useEffect(() => {
    fetchDueCards();
  }, []);

  const fetchDueCards = async () => {
    try {
      const res: any = await api.get('/api/decks/due');
      if (res.success) {
        setCards(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Che từ vựng mục tiêu trong câu ví dụ bằng *****
  const maskTargetWord = (sentence?: string, word?: string) => {
    if (!sentence || !word) return '...';
    const escapedWord = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');
    return sentence.replace(regex, '*****');
  };

  // Phát âm từ vựng
  const speakWord = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheckWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedWord.trim()) return;

    const currentCard = cards[currentIndex];
    const cleanTyped = typedWord.trim().toLowerCase();
    const cleanActual = currentCard.front.trim().toLowerCase();
    const correct = cleanTyped === cleanActual;
    
    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
      playSound('correct');
      setTimeout(() => {
        speakWord(currentCard.front);
      }, 650);
    } else {
      playSound('wrong');
      setTimeout(() => {
        speakWord(currentCard.front);
      }, 650);
    }
  };

  const handleShowAnswer = () => {
    const currentCard = cards[currentIndex];
    setIsCorrect(false);
    setIsChecked(true);
    playSound('wrong');
    setTimeout(() => {
      speakWord(currentCard.front);
    }, 650);
  };

  const handleReviewSubmit = async (quality: number) => {
    const currentCard = cards[currentIndex];

    // Phát âm thanh phản hồi theo chất lượng nhớ
    if (quality >= 3) {
      playSound('correct');
    } else if (quality === 1) {
      playSound('wrong');
    }

    try {
      // Gọi API cập nhật tiến trình ôn tập (SM-2)
      await api.post('/api/review', {
        cardId: currentCard.cardId,
        quality: quality,
      });

      // Chuyển sang card tiếp theo
      if (currentIndex < cards.length - 1) {
        setTypedWord('');
        setIsChecked(false);
        setIsCorrect(false);
        setCurrentIndex(currentIndex + 1);
      } else {
        // Hoàn thành phiên ôn tập -> Lưu lại thời điểm kết thúc
        localStorage.setItem('last_session_time', Date.now().toString());
        setCurrentIndex(currentIndex + 1); // Trạng thái hoàn thành
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-sans">
        Đang chuẩn bị thẻ ôn tập...
      </div>
    );
  }

  // Kết thúc phiên ôn tập
  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

        <div className="max-w-md w-full bg-card border border-border p-8 rounded-3xl text-center space-y-6 shadow-lg relative z-10">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="h-10 w-10 animate-bounce text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Hoàn thành xuất sắc!
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Bạn đã hoàn thành phiên ôn tập. Hệ thống Spaced Repetition (SM-2) sẽ tự động tính toán và gửi email nhắc bạn quay lại ôn tập vào <strong>Thời điểm vàng 30 phút sau</strong>.
          </p>

          <Button 
            onClick={() => router.push('/')}
            className="w-full bg-primary hover:bg-primary/95 text-white py-6 rounded-2xl font-bold shadow-md text-base font-sans"
          >
            Quay về Trang chủ
          </Button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = ((currentIndex) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden pb-10">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl" />

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-card/85 relative z-10">
        <Button 
          onClick={() => router.push('/')}
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-bold text-sm text-muted-foreground font-sans">
          Tiến trình ôn tập: Thẻ {currentIndex + 1} / {cards.length}
        </span>
        <div className="w-10 h-1" />
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-muted relative z-10">
        <Progress value={progressPercent} className="h-full bg-primary rounded-none transition-all duration-300" />
      </div>

      {/* Main Review Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-6 mt-8 flex flex-col justify-center relative z-10 space-y-6">
        {/* Flashcard Ôn tập trực tiếp (Nghĩa tiếng Việt & Câu ví dụ che từ) */}
        <Card className="w-full border-border bg-card shadow-md p-8 text-center rounded-3xl relative overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center space-y-5 p-0">
            <span className="text-xs text-primary font-bold uppercase tracking-wider bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
              Ý nghĩa tiếng Việt
            </span>

            {/* Nghĩa tiếng Việt */}
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-wide">
              {currentCard.back}
            </h2>

            {/* Câu ví dụ (Che từ vựng khi chưa kiểm tra, hiện đầy đủ khi đã kiểm tra) */}
            {currentCard.exampleSentence && (
              <div className="border-t border-border pt-4 w-full">
                <p className="text-sm md:text-base text-muted-foreground italic leading-relaxed px-2">
                  "{isChecked 
                    ? currentCard.exampleSentence 
                    : maskTargetWord(currentCard.exampleSentence, currentCard.front)}"
                </p>
              </div>
            )}

            {/* Hiển thị từ tiếng Anh gốc và phiên âm SAU KHI bấm Kiểm tra */}
            {isChecked && (
              <div className="w-full pt-4 border-t border-border animate-fade-in space-y-3">
                <div className="flex items-center justify-center space-x-3">
                  <h1 className="text-3xl font-black text-primary tracking-wide">
                    {currentCard.front}
                  </h1>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => speakWord(currentCard.front)}
                    className="h-9 w-9 rounded-full border-primary/30 text-primary hover:bg-primary/10"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
                {currentCard.pronunciation && (
                  <p className="text-xs font-mono text-muted-foreground">
                    {currentCard.pronunciation}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ô nhập từ vựng tiếng Anh */}
        <div className="p-6 rounded-3xl border border-border bg-card space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-foreground">
              Nhập từ vựng tiếng Anh tương ứng:
            </span>
            {!isChecked && (
              <button 
                type="button" 
                onClick={handleShowAnswer}
                className="text-xs text-muted-foreground hover:text-primary underline flex items-center space-x-1"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Không nhớ từ này?</span>
              </button>
            )}
          </div>

          <form onSubmit={handleCheckWord} className="flex space-x-3">
            <Input
              type="text"
              placeholder="Gõ từ tiếng Anh tại đây..."
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value)}
              disabled={isChecked}
              autoFocus
              className={`bg-background text-foreground text-base placeholder:text-gray-400 focus-visible:ring-primary h-12 rounded-2xl border-2 ${
                isChecked
                  ? isCorrect
                    ? 'border-emerald-500 bg-emerald-50/10 focus-visible:ring-emerald-500 font-bold'
                    : 'border-rose-500 bg-rose-50/10 focus-visible:ring-rose-500 font-bold'
                  : 'border-border'
              }`}
            />
            {!isChecked ? (
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white px-7 h-12 rounded-2xl font-bold font-sans shadow-sm">
                Kiểm tra
              </Button>
            ) : (
              <div className={`flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 animate-bounce' : 'bg-rose-100 text-rose-700 border border-rose-300'}`}>
                {isCorrect ? <Check className="h-6 w-6 stroke-[3]" /> : <X className="h-6 w-6 stroke-[3]" />}
              </div>
            )}
          </form>

          {isChecked && !isCorrect && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center justify-between animate-fade-in">
              <span>Đáp án đúng: <strong className="font-mono text-sm underline">{currentCard.front}</strong></span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => speakWord(currentCard.front)}
                className="text-rose-700 hover:text-rose-900 hover:bg-rose-100 h-7 px-2"
              >
                <Volume2 className="h-4 w-4 mr-1" /> Nghe lại
              </Button>
            </div>
          )}
        </div>

        {/* 4 Nút đánh giá SM-2 (Xuất hiện sau khi bấm Kiểm tra) */}
        {isChecked && (
          <div className="space-y-3 animate-fade-in pt-2">
            <h5 className="text-xs font-bold text-muted-foreground text-center uppercase tracking-wider">
              Đánh giá mức độ nhớ để tính lịch ôn tiếp theo
            </h5>
            <div className="grid grid-cols-4 gap-3">
              <Button 
                onClick={() => handleReviewSubmit(1)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-6 rounded-2xl font-bold flex flex-col h-auto transition-transform hover:scale-[1.03]"
              >
                <span className="text-sm">Quên</span>
                <span className="text-[10px] font-normal text-red-600/70 mt-1">Lại sau 30p</span>
              </Button>
              <Button 
                onClick={() => handleReviewSubmit(2)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 py-6 rounded-2xl font-bold flex flex-col h-auto transition-transform hover:scale-[1.03]"
              >
                <span className="text-sm">Khó</span>
                <span className="text-[10px] font-normal text-amber-600/70 mt-1">Lại ngày mai</span>
              </Button>
              <Button 
                onClick={() => handleReviewSubmit(3)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 py-6 rounded-2xl font-bold flex flex-col h-auto transition-transform hover:scale-[1.03]"
              >
                <span className="text-sm">Nhớ</span>
                <span className="text-[10px] font-normal text-indigo-600/70 mt-1">Lại sau vài ngày</span>
              </Button>
              <Button 
                onClick={() => handleReviewSubmit(4)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 py-6 rounded-2xl font-bold flex flex-col h-auto transition-transform hover:scale-[1.03]"
              >
                <span className="text-sm">Dễ</span>
                <span className="text-[10px] font-normal text-emerald-600/70 mt-1">Lại dài hạn</span>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
