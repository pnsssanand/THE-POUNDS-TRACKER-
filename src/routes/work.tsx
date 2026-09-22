import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getWorkSessions, addWorkSession, updateWorkSession, deleteWorkSession } from "../services/workService";
import type { WorkSession } from "../types";
import { formatMoney, formatDateUK, formatHours } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Plus, Trash2, Search, Briefcase, RefreshCw, Edit2 } from "lucide-react";

export const Route = createFileRoute("/work")({
  component: WorkPage,
});

function WorkPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkIn, setCheckIn] = useState("09:00");
  const [checkOut, setCheckOut] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState("0");
  const [hourlyRate, setHourlyRate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = await getWorkSessions(uid);
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [uid]);

  const resetForm = () => {
    setEditingId(null);
    setCompanyName(""); setWorkDate(new Date().toISOString().split('T')[0]); 
    setCheckIn("09:00"); setCheckOut("17:00"); setBreakMinutes("0"); 
    setHourlyRate(""); setNotes("");
  };

  const handleEdit = (s: WorkSession) => {
    setEditingId(s.id);
    setCompanyName(s.companyName);
    setWorkDate(s.workDate);
    setCheckIn(s.checkIn);
    setCheckOut(s.checkOut);
    setBreakMinutes(s.breakMinutes.toString());
    setHourlyRate(s.hourlyRate.toString());
    setNotes(s.notes || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setIsSubmitting(true);
    try {
      const input = {
        companyName,
        workDate,
        checkIn,
        checkOut,
        breakMinutes: parseInt(breakMinutes) || 0,
        hourlyRate: parseFloat(hourlyRate) || 0,
        notes
      };
      if (editingId) {
        await updateWorkSession(uid, editingId, input);
      } else {
        await addWorkSession(uid, input);
      }
      setIsOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    if (confirm("Delete this work session?")) {
      await deleteWorkSession(uid, id);
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading work sessions...</div>
      </div>
    );
  }

  const filteredSessions = sessions.filter(s => 
    s.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEarnings = sessions.reduce((acc, s) => acc + s.earnings, 0);
  const totalHours = sessions.reduce((acc, s) => acc + s.workedHours, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work & Earnings</h1>
          <p className="text-zinc-500 mt-1">Log your shifts and track your income.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if(!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none"><Plus className="w-4 h-4 mr-2" /> Add Shift</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader><DialogTitle>{editingId ? "Edit Work Session" : "Add Work Session"}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Company Name</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input type="date" value={workDate} onChange={e => setWorkDate(e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Check In</Label>
                    <Input type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Check Out</Label>
                    <Input type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Break (minutes)</Label>
                    <Input type="number" min="0" value={breakMinutes} onChange={e => setBreakMinutes(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Hourly Rate (£)</Label>
                    <Input type="number" step="0.01" min="0" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{editingId ? "Save Changes" : "Save Shift"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Shifts</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{sessions.length}</div></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Hours</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatHours(totalHours)}</div></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Earnings</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{formatMoney(totalEarnings)}</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle>History</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input placeholder="Search company..." className="pl-9 w-full sm:w-[250px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSessions.length === 0 ? (
             <div className="text-center py-12 text-zinc-500">No work sessions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium whitespace-nowrap">{formatDateUK(s.workDate)}</TableCell>
                      <TableCell>{s.companyName}</TableCell>
                      <TableCell>{formatHours(s.workedHours)}</TableCell>
                      <TableCell>{formatMoney(s.hourlyRate)}/hr</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">{formatMoney(s.earnings)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 mr-1">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
