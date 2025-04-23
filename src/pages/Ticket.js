import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; // Sửa import
import { getTicket } from '../services/api';

const Ticket = () => {
  const { orderId } = useParams();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await getTicket(orderId);
        setTicket(data);
      } catch (err) {
        console.error('Failed to fetch ticket:', err);
        alert('Failed to fetch ticket: ' + (err.response?.data?.error || 'Unknown error'));
      }
    };
    fetchTicket();
  }, [orderId]);

  if (!ticket) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 flex justify-center">
      <div className="bg-white rounded shadow p-6 max-w-sm w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Your Ticket</h1>
        <p className="mb-2">Order #{ticket.order_id}</p>
        <p className="mb-4">Ticket Code: <span className="font-semibold">{ticket.ticket_code}</span></p>
        <div className="flex justify-center mb-4">
          <QRCodeCanvas value={ticket.ticket_code} size={200} /> {/* Sử dụng QRCodeCanvas */}
        </div>
        <p className="text-gray-600">
          Issued at: {new Date(ticket.issued_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Ticket;